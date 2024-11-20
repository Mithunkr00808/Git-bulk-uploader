document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const owner = document.getElementById("owner").value;
  const repo = document.getElementById("repo").value;
  const branch = document.getElementById("branch").value || "main";
  const token = document.getElementById("token").value;
  const files = document.getElementById("files").files;

  if (!files.length) {
    alert("Please select at least one file.");
    return;
  }

  const statusDiv = document.getElementById("status");
  const progressWrapper = document.getElementById("progressWrapper");
  const progressBar = document.getElementById("progressBar");
  const progressPercent = document.getElementById("progressPercent");

  progressWrapper.style.display = "block";  // Show progress bar

  statusDiv.innerHTML = "<p>Uploading...</p>";

  let totalFiles = files.length;
  let uploadedFiles = 0;

  try {
    for (const file of files) {
      const fileContent = await file.text();
      const encodedContent = btoa(fileContent);
      const fileName = file.name;

      // Step 1: Check if the file already exists on GitHub
      const fileSha = await getFileSha(owner, repo, fileName, branch, token);
      
      if (fileSha) {
        // Step 2: Compare the existing file's content (SHA) with the new content
        const newSha = await getSHA(fileContent);
        if (newSha === fileSha) {
          statusDiv.innerHTML += `<p class="success">✅ No changes detected for ${fileName}. Skipping upload.</p>`;
          continue; // Skip upload if the file content is identical
        }
      }

      // Step 3: Upload or overwrite the file using XMLHttpRequest
      const uploadUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;
      const xhr = new XMLHttpRequest();
      
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Accept", "application/vnd.github+json");

      // Track progress
      xhr.upload.addEventListener("progress", function(event) {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          progressBar.value = percent;
          progressPercent.textContent = `${Math.round(percent)}%`;
        }
      });

      // Handle the response from GitHub API
      xhr.onload = async function() {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 201 || xhr.status === 200) {
          uploadedFiles++;
          statusDiv.innerHTML += `<p class="success">✅ Uploaded: ${fileName}</p>`;
        } else {
          statusDiv.innerHTML += `<p class="error">❌ Failed to upload ${fileName}: ${data.message}</p>`;
        }

        // Update overall progress
        const overallProgress = (uploadedFiles / totalFiles) * 100;
        progressBar.value = overallProgress;
        progressPercent.textContent = `${Math.round(overallProgress)}%`;
      };

      // Prepare the payload and send the request
      const payload = JSON.stringify({
        message: `Upload/Overwrite ${fileName}`,
        content: encodedContent,
        branch: branch,
        sha: fileSha || undefined, // Include SHA to overwrite if the file exists
      });
      
      xhr.send(payload);
    }
  } catch (error) {
    console.error("Error uploading files:", error);
    statusDiv.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
  }
});

// Function to get the SHA of an existing file in the repository
async function getFileSha(owner, repo, fileName, branch, token) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}?ref=${branch}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.sha; // Return the file's SHA if it exists
    } else if (response.status === 404) {
      return null; // File does not exist
    } else {
      throw new Error(`Failed to fetch file SHA: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching file SHA:", error);
    throw error;
  }
}

// Function to calculate SHA for file content (for comparison)
function getSHA(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  return crypto.subtle.digest("SHA-1", data).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
  });
}
