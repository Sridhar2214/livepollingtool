package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/livepoll/backend/database"
	"github.com/livepoll/backend/models"
)

type VoteController struct {
	mongoStore *database.MongoService
	redisStore *database.RedisService
}

func NewVoteController(mongoStore *database.MongoService, redisStore *database.RedisService) *VoteController {
	return &VoteController{
		mongoStore: mongoStore,
		redisStore: redisStore,
	}
}

func (vc *VoteController) SubmitVote(c *gin.Context) {
	var dto models.VoteRequest
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	poll, err := vc.mongoStore.GetPollByID(c.Request.Context(), dto.PollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	// Server-side Validation: Check if poll is closed
	if poll.IsClosed {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This poll is closed for new responses"})
		return
	}

	// Server-side Validation: Check if poll expired
	if poll.Settings.ExpiresAt != nil && time.Now().After(*poll.Settings.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This poll has expired"})
		return
	}

	// Server-side Validation: Check multiple choice policy
	if !poll.Settings.AllowMultiple && len(dto.OptionIDs) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Multiple choice is disabled for this poll"})
		return
	}

	// Server-side Validation: Verify option IDs exist in poll
	validOptionIDs := make(map[string]bool)
	for _, opt := range poll.Options {
		validOptionIDs[opt.ID] = true
	}

	for _, optID := range dto.OptionIDs {
		if !validOptionIDs[optID] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option selected"})
			return
		}
	}

	// Server-side Validation: Deduplicate check via Redis
	alreadyVoted, err := vc.redisStore.CheckIfVoted(c.Request.Context(), poll.ID, dto.VoterFingerprint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify vote status"})
		return
	}
	if alreadyVoted {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already cast your vote for this poll"})
		return
	}

	// Execute real-time vote record in Redis (atomic INCR + PubSub broadcast)
	updatedOptionVotes, newTotalVotes, err := vc.redisStore.RecordVote(c.Request.Context(), poll.ID, dto.OptionIDs, dto.VoterFingerprint)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Asynchronously write to MongoDB audit & persistent collections
	go func() {
		ctx := c.Request.Context()
		vc.mongoStore.UpdatePollVotes(ctx, poll.ID, updatedOptionVotes, newTotalVotes)
		vc.mongoStore.SaveVoteRecord(ctx, &models.VoteRecord{
			ID:               uuid.New().String(),
			PollID:           poll.ID,
			OptionIDs:        dto.OptionIDs,
			VoterFingerprint: dto.VoterFingerprint,
			IPAddress:        c.ClientIP(),
			VotedAt:          time.Now(),
		})
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":      "Vote successfully cast",
		"total_votes":  newTotalVotes,
		"option_votes": updatedOptionVotes,
	})
}
