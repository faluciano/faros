package schemas

import (
	"bytes"
	"strings"

	"github.com/go-webauthn/webauthn/webauthn"
)

type PasskeyUser struct {
	User
	Handle             []byte
	Credentials        []webauthn.Credential
	CredentialVersions []int64
}

func (u PasskeyUser) WebAuthnID() []byte {
	return u.Handle
}

func (u PasskeyUser) WebAuthnName() string {
	return u.Email
}

func (u PasskeyUser) WebAuthnDisplayName() string {
	displayName := strings.TrimSpace(u.FirstName + " " + u.LastName)
	if displayName == "" {
		return u.Email
	}
	return displayName
}

func (u PasskeyUser) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

func (u PasskeyUser) CredentialVersion(credentialID []byte) (int64, bool) {
	for index, credential := range u.Credentials {
		if bytes.Equal(credential.ID, credentialID) && index < len(u.CredentialVersions) {
			return u.CredentialVersions[index], true
		}
	}
	return 0, false
}

type PasskeySession struct {
	ID       string
	RPID     string
	Ceremony string
	Data     webauthn.SessionData
	User     User
}
