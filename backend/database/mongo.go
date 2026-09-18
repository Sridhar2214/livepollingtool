package database

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/livepoll/backend/config"
	"github.com/livepoll/backend/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoService struct {
	Client   *mongo.Client
	Database *mongo.Database
	IsMemory bool

	// In-memory fallbacks when MongoDB is not running locally
	mu    sync.RWMutex
	users map[string]*models.User
	polls map[string]*models.Poll
	votes map[string][]*models.VoteRecord
}

var MongoStore *MongoService

func InitMongo(cfg *config.Config) *MongoService {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(cfg.MongoURI)
	client, err := mongo.Connect(clientOpts)

	store := &MongoService{
		users: make(map[string]*models.User),
		polls: make(map[string]*models.Poll),
		votes: make(map[string][]*models.VoteRecord),
	}

	if err == nil {
		errPing := client.Ping(ctx, nil)
		if errPing == nil {
			log.Println("✅ Successfully connected to MongoDB at", cfg.MongoURI)
			store.Client = client
			store.Database = client.Database(cfg.DBName)
			store.IsMemory = false
			MongoStore = store
			return store
		}
	}

	log.Println("⚠️ MongoDB connection unavailable. Operating in persistent In-Memory DB Mode for instant local execution.")
	store.IsMemory = true
	MongoStore = store
	return store
}

// User Operations
func (m *MongoService) CreateUser(ctx context.Context, user *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.IsMemory {
		coll := m.Database.Collection("users")
		_, err := coll.InsertOne(ctx, user)
		return err
	}

	for _, existing := range m.users {
		if existing.Email == user.Email {
			return fmt.Errorf("user with email already exists")
		}
	}
	m.users[user.ID] = user
	return nil
}

func (m *MongoService) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if !m.IsMemory {
		coll := m.Database.Collection("users")
		var user models.User
		err := coll.FindOne(ctx, bson.M{"email": email}).Decode(&user)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (m *MongoService) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if !m.IsMemory {
		coll := m.Database.Collection("users")
		var user models.User
		err := coll.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	user, ok := m.users[id]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	return user, nil
}

// Poll Operations
func (m *MongoService) CreatePoll(ctx context.Context, poll *models.Poll) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.IsMemory {
		coll := m.Database.Collection("polls")
		_, err := coll.InsertOne(ctx, poll)
		return err
	}

	m.polls[poll.ID] = poll
	return nil
}

func (m *MongoService) GetPollByID(ctx context.Context, id string) (*models.Poll, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if !m.IsMemory {
		coll := m.Database.Collection("polls")
		var poll models.Poll
		err := coll.FindOne(ctx, bson.M{"_id": id}).Decode(&poll)
		if err != nil {
			// Try by slug
			err = coll.FindOne(ctx, bson.M{"slug": id}).Decode(&poll)
			if err != nil {
				return nil, err
			}
		}
		return &poll, nil
	}

	poll, ok := m.polls[id]
	if !ok {
		// check slug
		for _, p := range m.polls {
			if p.Slug == id {
				return p, nil
			}
		}
		return nil, fmt.Errorf("poll not found")
	}
	return poll, nil
}

func (m *MongoService) GetPollsByCreator(ctx context.Context, creatorID string) ([]models.Poll, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if !m.IsMemory {
		coll := m.Database.Collection("polls")
		cursor, err := coll.Find(ctx, bson.M{"creator_id": creatorID})
		if err != nil {
			return nil, err
		}
		defer cursor.Close(ctx)
		var polls []models.Poll
		if err := cursor.All(ctx, &polls); err != nil {
			return nil, err
		}
		return polls, nil
	}

	var userPolls []models.Poll
	for _, p := range m.polls {
		if p.CreatorID == creatorID {
			userPolls = append(userPolls, *p)
		}
	}
	return userPolls, nil
}

func (m *MongoService) UpdatePollVotes(ctx context.Context, pollID string, optionVotes map[string]int64, totalVotes int64) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.IsMemory {
		coll := m.Database.Collection("polls")
		poll, err := m.GetPollByID(ctx, pollID)
		if err != nil {
			return err
		}
		for i := range poll.Options {
			if v, ok := optionVotes[poll.Options[i].ID]; ok {
				poll.Options[i].Votes = v
			}
		}
		poll.TotalVotes = totalVotes
		poll.UpdatedAt = time.Now()

		_, err = coll.ReplaceOne(ctx, bson.M{"_id": pollID}, poll)
		return err
	}

	poll, ok := m.polls[pollID]
	if ok {
		for i := range poll.Options {
			if v, ok := optionVotes[poll.Options[i].ID]; ok {
				poll.Options[i].Votes = v
			}
		}
		poll.TotalVotes = totalVotes
		poll.UpdatedAt = time.Now()
	}
	return nil
}

func (m *MongoService) ClosePoll(ctx context.Context, pollID string, creatorID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.IsMemory {
		coll := m.Database.Collection("polls")
		_, err := coll.UpdateOne(ctx, bson.M{"_id": pollID, "creator_id": creatorID}, bson.M{"$set": bson.M{"is_closed": true, "updated_at": time.Now()}})
		return err
	}

	poll, ok := m.polls[pollID]
	if !ok || poll.CreatorID != creatorID {
		return fmt.Errorf("poll not found or unauthorized")
	}
	poll.IsClosed = true
	poll.UpdatedAt = time.Now()
	return nil
}

func (m *MongoService) DeletePoll(ctx context.Context, pollID string, creatorID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.IsMemory {
		coll := m.Database.Collection("polls")
		_, err := coll.DeleteOne(ctx, bson.M{"_id": pollID, "creator_id": creatorID})
		return err
	}

	poll, ok := m.polls[pollID]
	if !ok || poll.CreatorID != creatorID {
		return fmt.Errorf("poll not found or unauthorized")
	}
	delete(m.polls, pollID)
	return nil
}

func (m *MongoService) SaveVoteRecord(ctx context.Context, record *models.VoteRecord) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.IsMemory {
		coll := m.Database.Collection("votes")
		_, err := coll.InsertOne(ctx, record)
		return err
	}

	m.votes[record.PollID] = append(m.votes[record.PollID], record)
	return nil
}
