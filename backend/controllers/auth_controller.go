package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/livepoll/backend/config"
	"github.com/livepoll/backend/database"
	"github.com/livepoll/backend/models"
)

type AuthController struct {
	cfg        *config.Config
	mongoStore *database.MongoService
}

func NewAuthController(cfg *config.Config, mongoStore *database.MongoService) *AuthController {
	return &AuthController{
		cfg:        cfg,
		mongoStore: mongoStore,
	}
}

func (ac *AuthController) Register(c *gin.Context) {
	var dto models.RegisterDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := &models.User{
		ID:        uuid.New().String(),
		Username:  dto.Username,
		Email:     dto.Email,
		Password:  dto.Password,
		CreatedAt: time.Now(),
	}

	if err := user.HashPassword(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
		return
	}

	if err := ac.mongoStore.CreateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := ac.generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate session token"})
		return
	}

	userResponse := *user
	userResponse.Password = ""

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  userResponse,
	})
}

func (ac *AuthController) Login(c *gin.Context) {
	var dto models.LoginDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := ac.mongoStore.GetUserByEmail(c.Request.Context(), dto.Email)
	if err != nil || !user.CheckPassword(dto.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := ac.generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate session token"})
		return
	}

	userResponse := *user
	userResponse.Password = ""

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  userResponse,
	})
}

func (ac *AuthController) GetMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := ac.mongoStore.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	userResponse := *user
	userResponse.Password = ""
	c.JSON(http.StatusOK, userResponse)
}

func (ac *AuthController) generateJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"email":    user.Email,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ac.cfg.JWTSecret))
}
