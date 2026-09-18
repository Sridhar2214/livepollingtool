package database

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/livepoll/backend/config"
	"github.com/livepoll/backend/models"
	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	Client   *redis.Client
	IsMemory bool

	// In-Memory state fallback for Pub/Sub & Atomic Increments
	mu          sync.RWMutex
	voters      map[string]map[string]bool  // pollID -> fingerprint -> true
	optionVotes map[string]map[string]int64 // pollID -> optionID -> count
	totalVotes  map[string]int64            // pollID -> count
	subscribers map[string][]chan string    // pollID -> channels
}

var RedisStore *RedisService

func InitRedis(cfg *config.Config) *RedisService {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	store := &RedisService{
		Client:      client,
		voters:      make(map[string]map[string]bool),
		optionVotes: make(map[string]map[string]int64),
		totalVotes:  make(map[string]int64),
		subscribers: make(map[string][]chan string),
	}

	_, err := client.Ping(ctx).Result()
	if err == nil {
		log.Println("⚡ Successfully connected to Redis at", cfg.RedisAddr)
		store.IsMemory = false
		RedisStore = store
		return store
	}

	log.Println("⚠️ Redis connection unavailable. Operating in High-Performance In-Memory Redis Driver Mode.")
	store.IsMemory = true
	RedisStore = store
	return store
}

// CheckIfVoted checks if a voter fingerprint already voted on this poll
func (r *RedisService) CheckIfVoted(ctx context.Context, pollID string, fingerprint string) (bool, error) {
	if !r.IsMemory {
		key := fmt.Sprintf("poll:%s:voters", pollID)
		isMember, err := r.Client.SIsMember(ctx, key, fingerprint).Result()
		if err != nil {
			return false, err
		}
		return isMember, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	if pVoters, ok := r.voters[pollID]; ok {
		return pVoters[fingerprint], nil
	}
	return false, nil
}

// RecordVote performs atomic increment in Redis & publishes to Pub/Sub
func (r *RedisService) RecordVote(ctx context.Context, pollID string, optionIDs []string, fingerprint string) (map[string]int64, int64, error) {
	if !r.IsMemory {
		voterKey := fmt.Sprintf("poll:%s:voters", pollID)
		votesKey := fmt.Sprintf("poll:%s:option_votes", pollID)
		totalKey := fmt.Sprintf("poll:%s:total_votes", pollID)

		// Check & Add voter atomically
		added, err := r.Client.SAdd(ctx, voterKey, fingerprint).Result()
		if err != nil {
			return nil, 0, err
		}
		if added == 0 {
			return nil, 0, fmt.Errorf("voter has already submitted a vote for this poll")
		}

		// Increment option votes
		pipe := r.Client.Pipeline()
		for _, optID := range optionIDs {
			pipe.HIncrBy(ctx, votesKey, optID, 1)
		}
		pipe.IncrBy(ctx, totalKey, int64(len(optionIDs)))
		_, err = pipe.Exec(ctx)
		if err != nil {
			return nil, 0, err
		}

		// Fetch updated tallies
		resMap, err := r.Client.HGetAll(ctx, votesKey).Result()
		if err != nil {
			return nil, 0, err
		}

		totalStr, err := r.Client.Get(ctx, totalKey).Result()
		totalVal, _ := strconv.ParseInt(totalStr, 10, 64)

		optionVotes := make(map[string]int64)
		for k, v := range resMap {
			count, _ := strconv.ParseInt(v, 10, 64)
			optionVotes[k] = count
		}

		// Publish event to Redis Pub/Sub channel
		r.PublishVoteUpdate(ctx, pollID, optionVotes, totalVal, false)

		return optionVotes, totalVal, nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	// In-memory Redis simulation logic
	if r.voters[pollID] == nil {
		r.voters[pollID] = make(map[string]bool)
	}
	if r.voters[pollID][fingerprint] {
		return nil, 0, fmt.Errorf("voter has already submitted a vote for this poll")
	}

	r.voters[pollID][fingerprint] = true

	if r.optionVotes[pollID] == nil {
		r.optionVotes[pollID] = make(map[string]int64)
	}

	for _, optID := range optionIDs {
		r.optionVotes[pollID][optID]++
	}
	r.totalVotes[pollID] += int64(len(optionIDs))

	// Copy maps for response
	copied := make(map[string]int64)
	for k, v := range r.optionVotes[pollID] {
		copied[k] = v
	}
	totalVal := r.totalVotes[pollID]

	// Publish to in-memory subscriber channels
	r.publishInMemory(pollID, copied, totalVal, false)

	return copied, totalVal, nil
}

// GetVoteTallies gets live tallies from Redis cache
func (r *RedisService) GetVoteTallies(ctx context.Context, pollID string) (map[string]int64, int64, error) {
	if !r.IsMemory {
		votesKey := fmt.Sprintf("poll:%s:option_votes", pollID)
		totalKey := fmt.Sprintf("poll:%s:total_votes", pollID)

		resMap, err := r.Client.HGetAll(ctx, votesKey).Result()
		if err != nil && err != redis.Nil {
			return nil, 0, err
		}

		totalStr, _ := r.Client.Get(ctx, totalKey).Result()
		totalVal, _ := strconv.ParseInt(totalStr, 10, 64)

		optionVotes := make(map[string]int64)
		for k, v := range resMap {
			count, _ := strconv.ParseInt(v, 10, 64)
			optionVotes[k] = count
		}

		return optionVotes, totalVal, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	copied := make(map[string]int64)
	if optMap, ok := r.optionVotes[pollID]; ok {
		for k, v := range optMap {
			copied[k] = v
		}
	}
	return copied, r.totalVotes[pollID], nil
}

// PublishVoteUpdate broadcasts message to Redis Pub/Sub
func (r *RedisService) PublishVoteUpdate(ctx context.Context, pollID string, optionVotes map[string]int64, totalVotes int64, isClosed bool) {
	msg := models.RealtimeVoteMessage{
		Type:        "VOTE_UPDATE",
		PollID:      pollID,
		TotalVotes:  totalVotes,
		OptionVotes: optionVotes,
		IsClosed:    isClosed,
		Timestamp:   time.Now(),
	}
	bytes, _ := json.Marshal(msg)

	if !r.IsMemory {
		channel := fmt.Sprintf("poll:%s:events", pollID)
		r.Client.Publish(ctx, channel, string(bytes))
		return
	}

	r.publishInMemory(pollID, optionVotes, totalVotes, isClosed)
}

func (r *RedisService) publishInMemory(pollID string, optionVotes map[string]int64, totalVotes int64, isClosed bool) {
	msg := models.RealtimeVoteMessage{
		Type:        "VOTE_UPDATE",
		PollID:      pollID,
		TotalVotes:  totalVotes,
		OptionVotes: optionVotes,
		IsClosed:    isClosed,
		Timestamp:   time.Now(),
	}
	bytes, _ := json.Marshal(msg)
	payload := string(bytes)

	if chs, ok := r.subscribers[pollID]; ok {
		for _, ch := range chs {
			select {
			case ch <- payload:
			default:
			}
		}
	}
}

// SubscribeToPoll creates a channel to receive real-time updates for a poll
func (r *RedisService) SubscribeToPoll(ctx context.Context, pollID string) (<-chan string, func()) {
	outCh := make(chan string, 100)

	if !r.IsMemory {
		channel := fmt.Sprintf("poll:%s:events", pollID)
		pubsub := r.Client.Subscribe(ctx, channel)

		go func() {
			ch := pubsub.Channel()
			for msg := range ch {
				outCh <- msg.Payload
			}
		}()

		cleanup := func() {
			pubsub.Close()
			close(outCh)
		}
		return outCh, cleanup
	}

	r.mu.Lock()
	r.subscribers[pollID] = append(r.subscribers[pollID], outCh)
	r.mu.Unlock()

	cleanup := func() {
		r.mu.Lock()
		defer r.mu.Unlock()
		chs := r.subscribers[pollID]
		for i, ch := range chs {
			if ch == outCh {
				r.subscribers[pollID] = append(chs[:i], chs[i+1:]...)
				break
			}
		}
		close(outCh)
	}

	return outCh, cleanup
}
