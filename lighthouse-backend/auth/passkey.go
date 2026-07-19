package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

const passkeyRandomBytes = 32

func NewPasskey(rpID string, origins []string) (*webauthn.WebAuthn, error) {
	rpID = strings.TrimSpace(rpID)
	if rpID == "" {
		return nil, fmt.Errorf("passkey relying party ID must be set")
	}

	normalizedOrigins := make([]string, 0, len(origins))
	for _, origin := range origins {
		if origin = strings.TrimSpace(origin); origin != "" {
			normalizedOrigins = append(normalizedOrigins, origin)
		}
	}
	if len(normalizedOrigins) == 0 {
		return nil, fmt.Errorf("at least one passkey origin must be set")
	}

	return webauthn.New(&webauthn.Config{
		RPID:                  rpID,
		RPDisplayName:         "Faros",
		RPOrigins:             normalizedOrigins,
		AttestationPreference: protocol.PreferNoAttestation,
		AuthenticatorSelection: protocol.AuthenticatorSelection{
			RequireResidentKey: protocol.ResidentKeyRequired(),
			ResidentKey:        protocol.ResidentKeyRequirementRequired,
			UserVerification:   protocol.VerificationRequired,
		},
		Timeouts: webauthn.TimeoutsConfig{
			Login: webauthn.TimeoutConfig{
				Enforce:    true,
				Timeout:    5 * time.Minute,
				TimeoutUVD: 5 * time.Minute,
			},
			Registration: webauthn.TimeoutConfig{
				Enforce:    true,
				Timeout:    5 * time.Minute,
				TimeoutUVD: 5 * time.Minute,
			},
		},
	})
}

func GenerateUserHandle() ([]byte, error) {
	handle := make([]byte, passkeyRandomBytes)
	if _, err := rand.Read(handle); err != nil {
		return nil, fmt.Errorf("generate passkey user handle: %w", err)
	}
	return handle, nil
}

func GenerateCeremonyID() (string, error) {
	id := make([]byte, passkeyRandomBytes)
	if _, err := rand.Read(id); err != nil {
		return "", fmt.Errorf("generate passkey ceremony ID: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(id), nil
}
