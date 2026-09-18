package models

import (
	"time"
)

type VoteRequest struct {
	PollID           string   `json:"poll_id" binding:"required"`
	OptionIDs        []string `json:"option_ids" binding:"required,min=1"`
	VoterFingerprint string   `json:"voter_fingerprint" binding:"required"`
}

type VoteRecord struct {
	ID               string    `json:"id" bson:"_id,omitempty"`
	PollID           string    `json:"poll_id" bson:"poll_id"`
	OptionIDs        []string  `json:"option_ids" bson:"option_ids"`
	VoterFingerprint string    `json:"voter_fingerprint" bson:"voter_fingerprint"`
	IPAddress        string    `json:"ip_address" bson:"ip_address"`
	VotedAt          time.Time `json:"voted_at" bson:"voted_at"`
}

type RealtimeVoteMessage struct {
	Type        string           `json:"type"` // "VOTE_UPDATE", "POLL_STATUS_CHANGE"
	PollID      string           `json:"poll_id"`
	TotalVotes  int64            `json:"total_votes"`
	OptionVotes map[string]int64 `json:"option_votes"` // Option ID -> Vote Count
	IsClosed    bool             `json:"is_closed"`
	Timestamp   time.Time        `json:"timestamp"`
}
