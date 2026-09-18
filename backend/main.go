package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/livepoll/backend/config"
	"github.com/livepoll/backend/controllers"
	"github.com/livepoll/backend/database"
	"github.com/livepoll/backend/middleware"
	"github.com/livepoll/backend/websocket"
)

func main() {
	cfg := config.LoadConfig()

	log.Println("🚀 Starting Live Polling Tool Backend Service...")

	// Initialize Database Services
	mongoStore := database.InitMongo(cfg)
	redisStore := database.InitRedis(cfg)

	// Initialize WebSocket Hub
	wsHub := websocket.InitHub(redisStore)

	// Initialize Controllers
	authCtrl := controllers.NewAuthController(cfg, mongoStore)
	pollCtrl := controllers.NewPollController(mongoStore, redisStore)
	voteCtrl := controllers.NewVoteController(mongoStore, redisStore)

	// Initialize Gin Router
	r := gin.Default()

	// Global Middleware
	r.Use(middleware.CORSMiddleware())

	// Health Check Route
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":   "healthy",
			"service":  "live-polling-backend",
			"database": mongoStore.IsMemory,
			"redis":    redisStore.IsMemory,
		})
	})

	// API v1 Router Group
	v1 := r.Group("/api/v1")
	{
		// Public Auth Routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authCtrl.Register)
			auth.POST("/login", authCtrl.Login)
		}

		// Public Poll & Voting Routes
		v1.GET("/polls/:id", pollCtrl.GetPoll)
		v1.POST("/votes", voteCtrl.SubmitVote)

		// Protected Creator Routes (Requires JWT Token)
		protected := v1.Group("/user")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/me", authCtrl.GetMe)
			protected.POST("/polls", pollCtrl.CreatePoll)
			protected.GET("/polls", pollCtrl.GetMyPolls)
			protected.POST("/polls/:id/close", pollCtrl.ClosePoll)
			protected.DELETE("/polls/:id", pollCtrl.DeletePoll)
		}
	}

	// Realtime WebSocket Endpoint
	r.GET("/ws/polls/:id", wsHub.HandleWebSocket)

	log.Printf("🌐 Live Polling Backend running on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("❌ Server failed to start: %v", err)
	}
}
