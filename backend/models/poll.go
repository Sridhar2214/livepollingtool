package models

import (
	"time"
)

type Option struct {
	ID    string `json:"id" bson:"id"`
	Text  string `json:"text" bson:"text"`
	Color string `json:"color" bson:"color"`
	Votes int64  `json:"votes" bson:"votes"`
}

type PollSettings struct {
	AllowMultiple         bool       `json:"allow_multiple" bson:"allow_multiple"`
	RequireAuthToVote     bool       `json:"require_auth_to_vote" bson:"require_auth_to_vote"`
	ShowResultsBeforeVote bool       `json:"show_results_before_vote" bson:"show_results_before_vote"`
	ExpiresAt             *time.Time `json:"expires_at,omitempty" bson:"expires_at,omitempty"`
}

type Poll struct {
	ID          string       `json:"id" bson:"_id,omitempty"`
	Slug        string       `json:"slug" bson:"slug"`
	CreatorID   string       `json:"creator_id" bson:"creator_id"`
	CreatorName string       `json:"creator_name" bson:"creator_name"`
	Question    string       `json:"question" bson:"question"`
	Description string       `json:"description,omitempty" bson:"description,omitempty"`
	Options     []Option     `json:"options" bson:"options"`
	Settings    PollSettings `json:"settings" bson:"settings"`
	IsClosed    bool         `json:"is_closed" bson:"is_closed"`
	TotalVotes  int64        `json:"total_votes" bson:"total_votes"`
	CreatedAt   time.Time    `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at" bson:"updated_at"`
}

type CreatePollDTO struct {
	Question    string       `json:"question" binding:"required,min=5"`
	Description string       `json:"description,omitempty"`
	Options     []string     `json:"options" binding:"required,min=2,dive,required"`
	Settings    PollSettings `json:"settings"`
}
