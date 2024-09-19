const API_BASE_URL = window.location.hostname === 'ilovequt.lol' ? `https://api.ilovequt.lol` : 'http://127.0.0.1:3000';

// Form submission for login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const loginMessageDiv = document.getElementById('loginMessage');

        try {
            const response = await fetch(`${API_BASE_URL}/cognito/authenticate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (response.ok) {
                loginMessageDiv.textContent = "Login successful!";
                localStorage.setItem('accessToken', result.accessToken);
                // Redirect to cracker.html
                window.location.href = 'cracker.html';
            } else {
                loginMessageDiv.textContent = `Login failed: ${result.message}`;
            }
        } catch (error) {
            console.error('Error during login:', error);
            loginMessageDiv.textContent = "An error occurred during login.";
        }
    });
}

// Form submission for signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;
        const messageDiv = document.getElementById('signupMessage');

        try {
            const response = await fetch(`${API_BASE_URL}/cognito/signUp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, email })
            });

            const result = await response.json();
            if (response.ok) {
                messageDiv.textContent = "Signup successful! Redirecting to confirmation page...";
                localStorage.setItem('username', username);
                setTimeout(() => {
                    window.location.href = 'confirm.html';
                }, 2000);
            } else {
                messageDiv.textContent = `Signup failed: ${result.error}`;
            }
        } catch (error) {
            console.error('Error during signup:', error);
            messageDiv.textContent = "An error occurred during signup.";
        }
    });
}

// Form submission for confirmation
const confirmForm = document.getElementById('confirmForm');
if (confirmForm) {
    confirmForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const confirmationCode = document.getElementById('confirmationCode').value;
        const username = localStorage.getItem('username');
        const messageDiv = document.getElementById('confirmationMessage');

        try {
            const response = await fetch(`${API_BASE_URL}/cognito/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, confirmationCode })
            });

            const result = await response.json();
            if (response.ok) {
                messageDiv.textContent = "Confirmation successful! Redirecting to login page...";
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                messageDiv.textContent = `Confirmation failed: ${result.error}`;
            }
        } catch (error) {
            console.error('Error during confirmation:', error);
            messageDiv.textContent = "An error occurred during confirmation.";
        }
    });
}

// Upload file function
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  uploadForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const uploadMessage = document.getElementById('uploadMessage');

    // Retrieve the access token from localStorage
    const accessToken = localStorage.getItem('accessToken');

    // Check if accessToken exists
    if (!accessToken) {
      uploadMessage.textContent = 'You are not logged in. Please log in to upload files.';
      return;
    }

    try {
      // Getting presigned URL
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });

      const result = await response.json();

      if (response.ok) {
        const presignedURL = result.url;

        // Uploading file to S3 through presigned URL
        const uploadResponse = await fetch(presignedURL, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (uploadResponse.ok) {
          uploadMessage.textContent = 'File uploaded successfully!';
          listFiles();
        } else {
          uploadMessage.textContent = 'Failed to upload file to S3.';
        }
      } else {
        uploadMessage.textContent = `Failed to get presigned URL: ${result.message}`;
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      uploadMessage.textContent = 'An error occurred during file upload.';
    }
  });
}



// List files function
async function listFiles() {
    const fileList = document.getElementById('fileList');
    const crackFileSelect = document.getElementById('crackFileSelect');
    
    // If neither element exists, exit the function
    if (!fileList && !crackFileSelect) return;
  
    // Clear existing content
    if (fileList) fileList.innerHTML = '';
    if (crackFileSelect) crackFileSelect.innerHTML = '';
  
    const accessToken = localStorage.getItem('accessToken');
  
    try {
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
        },
      });
  
      const files = await response.json();
  
      if (response.ok) {
        if (files.length === 0) {
          if (fileList) fileList.textContent = 'No files for this user.';
          if (crackFileSelect) {
            const option = document.createElement('option');
            option.textContent = 'No files available';
            option.disabled = true;
            crackFileSelect.appendChild(option);
          }
        } else {
          files.forEach(fileName => {
            // Populate fileList
            if (fileList) {
              const listItem = document.createElement('li');
              listItem.textContent = fileName;
  
              const downloadButton = document.createElement('button');
              downloadButton.textContent = 'Download';
              downloadButton.addEventListener('click', () => downloadFile(fileName));
              listItem.appendChild(document.createElement('br'));
              listItem.appendChild(downloadButton);
              fileList.appendChild(listItem);
            }
  
            // Populate crackFileSelect
            if (crackFileSelect) {
              const option = document.createElement('option');
              option.value = fileName;
              option.textContent = fileName;
              crackFileSelect.appendChild(option);
            }
          });
        }
      } else {
        if (fileList) fileList.textContent = 'Failed to retrieve files.';
        if (crackFileSelect) {
          const option = document.createElement('option');
          option.textContent = 'Failed to retrieve files';
          option.disabled = true;
          crackFileSelect.appendChild(option);
        }
      }
    } catch (error) {
      console.error('Error listing files:', error);
      if (fileList) fileList.textContent = 'An error occurred while listing files.';
      if (crackFileSelect) {
        const option = document.createElement('option');
        option.textContent = 'Error loading files';
        option.disabled = true;
        crackFileSelect.appendChild(option);
      }
    }
}

// Download file function
async function downloadFile(filename) {
    const accessToken = localStorage.getItem('accessToken');
  
    try {
      const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
        },
      });
  
      const result = await response.json();
  
      if (response.ok) {
        const presignedURL = result.url;
        // Redirect the user to the presigned URL
        window.open(presignedURL);
      } else {
        console.error('Error getting presigned URL:', result.message);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on cracker.html by checking for a unique element
    const fileList = document.getElementById('fileList');
    if (fileList) {
        listFiles();
    }
});

const responseContainer = document.getElementById('crackOutput');
const crackForm = document.getElementById('crackForm');
if (crackForm) {
  crackForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    responseContainer.innerHTML = '';
    const crackFileSelect = document.getElementById('crackFileSelect');
    const crackMask = document.getElementById('crackMask');
    const mask = crackMask.value;
    const fileName = crackFileSelect.value;
    const accessToken = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`${API_BASE_URL}/crack/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        },
        body: JSON.stringify({ fileName, mask }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          const chunk = decoder.decode(value, { stream: !done });
          responseContainer.innerHTML += chunk;  // Append the chunk to the div
      }

      if (response.ok) {
        // Display the cracking result to the user
        console.warn(`Cracking completed:\n${result.result}`);
      } else {
        console.warn(`Cracking failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error starting crack:', error);
      console.warn('An error occurred while starting the crack.');
    }
  });
}
