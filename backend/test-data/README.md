# TasViet Backend Testing

This directory contains test data and scripts for testing the TasViet backend API endpoints.

## User Registration Testing

### Test Data

The `user-registration.json` file contains sample test cases for the user registration endpoint. Each test case includes:

- `description`: A brief description of the test case
- `payload`: The JSON body to send to the endpoint
- `expectedStatus`: The expected HTTP status code
- `expectedMessage`: (For error cases) The expected error message

### Testing Scripts

There are three scripts available for running registration tests:

#### 1. PowerShell Script (Windows)

```
cd backend
.\scripts\test-registration.ps1
```

#### 2. Node.js Script (Cross-platform)

```
cd backend
node scripts/test-registration.js
```

Make sure you have installed axios:
```
npm install axios
```

#### 3. Bash Script (Linux/MacOS)

```
cd backend
chmod +x scripts/test-registration.sh
./scripts/test-registration.sh
```

Requires `jq` to be installed:
```
# Ubuntu/Debian
apt-get install jq

# MacOS
brew install jq
```

## Running the Tests

1. Make sure your backend server is running at http://localhost:5000
2. Choose one of the scripts above and run it
3. Select a specific test case number or 'a' to run all tests

## Notes

- After successfully registering a user, you may need to delete that user from the database before trying again with the same email
- These tests are meant for development and testing purposes only
- Remember to update the base URL in the scripts if your backend is running on a different port or host
