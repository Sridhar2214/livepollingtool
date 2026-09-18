package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/livepoll/backend/database"
	"github.com/livepoll/backend/models"
)

type PollController struct {
	mongoStore *database.MongoService
	redisStore *database.RedisService
}

func NewPollController(mongoStore *database.MongoService, redisStore *database.RedisService) *PollController {
	return &PollController{
		mongoStore: mongoStore,
		redisStore: redisStore,
	}
}

var defaultColors = []string{
	"#3B82F6", // Blue
	"#10B981", // Emerald
	"#F59E0B", // Amber
	"#EF4444", // Red
	"#8B5CF6", // Purple
	"#EC4899", // Pink
	"#06B6D4", // Cyan
	"#64748B", // Slate
}

func generateSlug() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func (pc *PollController) CreatePoll(c *gin.Context) {
	var dto models.CreatePollDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	username, _ := c.Get("username")

	// Server-side Validation
	if len(dto.Options) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll must contain at least 2 non-empty options"})
		return
	}

	cleanedOptions := []models.Option{}
	for i, optText := range dto.Options {
		trimmed := strings.TrimSpace(optText)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Poll options cannot be empty strings"})
			return
		}
		color := defaultColors[i%len(defaultColors)]
		cleanedOptions = append(cleanedOptions, models.Option{
			ID:    uuid.New().String()[:8],
			Text:  trimmed,
			Color: color,
			Votes: 0,
		})
	}

	pollID := uuid.New().String()
	slug := generateSlug()

	poll := &models.Poll{
		ID:          pollID,
		Slug:        slug,
		CreatorID:   userID.(string),
		CreatorName: username.(string),
		Question:    strings.TrimSpace(dto.Question),
		Description: strings.TrimSpace(dto.Description),
		Options:     cleanedOptions,
		Settings:    dto.Settings,
		IsClosed:    false,
		TotalVotes:  0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := pc.mongoStore.CreatePoll(c.Request.Context(), poll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create poll"})
		return
	}

	c.JSON(http.StatusCreated, poll)
}

func (pc *PollController) GetPoll(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID is required"})
		return
	}

	poll, err := pc.mongoStore.GetPollByID(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	// Fetch real-time live vote counts from Redis
	optionVotes, totalVotes, err := pc.redisStore.GetVoteTallies(c.Request.Context(), poll.ID)
	if err == nil && len(optionVotes) > 0 {
		poll.TotalVotes = totalVotes
		for i := range poll.Options {
			if count, ok := optionVotes[poll.Options[i].ID]; ok {
				poll.Options[i].Votes = count
			}
		}
	}

	// Check if poll expired automatically
	if poll.Settings.ExpiresAt != nil && time.Now().After(*poll.Settings.ExpiresAt) {
		poll.IsClosed = true
	}

	c.JSON(http.StatusOK, poll)
}

func (pc *PollController) GetMyPolls(c *gin.Context) {
	userID, _ := c.Get("userID")

	polls, err := pc.mongoStore.GetPollsByCreator(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user polls"})
		return
	}

	// Overlay Redis vote counts for each poll
	for i := range polls {
		optionVotes, totalVotes, err := pc.redisStore.GetVoteTallies(c.Request.Context(), polls[i].ID)
		if err == nil && len(optionVotes) > 0 {
			polls[i].TotalVotes = totalVotes
			for j := range polls[i].Options {
				if count, ok := optionVotes[polls[i].Options[j].ID]; ok {
					polls[i].Options[j].Votes = count
				}
			}
		}
		if polls[i].Settings.ExpiresAt != nil && time.Now().After(*polls[i].Settings.ExpiresAt) {
			polls[i].IsClosed = true
		}
	}

	c.JSON(http.StatusOK, polls)
}

func (pc *PollController) ClosePoll(c *gin.Context) {
	pollID := c.Param("id")
	userID, _ := c.Get("userID")

	if err := pc.mongoStore.ClosePoll(c.Request.Context(), pollID, userID.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Failed to close poll or unauthorized"})
		return
	}

	// Fetch current tallies & broadcast close event via Redis
	optionVotes, totalVotes, _ := pc.redisStore.GetVoteTallies(c.Request.Context(), pollID)
	pc.redisStore.PublishVoteUpdate(c.Request.Context(), pollID, optionVotes, totalVotes, true)

	c.JSON(http.StatusOK, gin.H{"message": "Poll successfully closed"})
}

func (pc *PollController) DeletePoll(c *gin.Context) {
	pollID := c.Param("id")
	userID, _ := c.Get("userID")

	if err := pc.mongoStore.DeletePoll(c.Request.Context(), pollID, userID.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Failed to delete poll or unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Poll successfully deleted"})
}
