function logMessage(message, type = "info") {
	const logScreen = document.getElementById("logScreen");
	const logEntry = document.createElement("p");
	logEntry.className = `log-message ${type}`;
	logEntry.textContent = message;

	logScreen.appendChild(logEntry);
	logScreen.scrollTop = logScreen.scrollHeight; // Auto-scroll to the latest log
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	const owner = document.getElementById("owner").value;
	const repo = document.getElementById("repo").value;
	const branch = document.getElementById("branch").value || "main";
	const token = document.getElementById("token").value;
	const files = document.getElementById("files").files;

	if (!files.length) {
		logMessage("No files selected. Please select at least one file.", "error");
		alert("Please select at least one file.");
		return;
	}

	const statusDiv = document.getElementById("status");
	const progressWrapper = document.getElementById("progressWrapper");
	const progressBar = document.getElementById("progressBar");
	const progressPercent = document.getElementById("progressPercent");

	progressWrapper.style.display = "block"; // Show progress bar
	logMessage(`Uploading...`, "info");

	let totalFiles = files.length;
	let uploadedFiles = 0;

	try {
		for (const file of files) {
			if (file.size > 99 * 1024 * 1024) {
				// File size exceeds 99MB; split and upload in newline-safe chunks
				const chunks = await splitFile(file, 24 * 1024 * 1024); // 50MB
				for (let i = 0; i < chunks.length; i++) {
					const chunk = chunks[i];
					const chunkName = `${file.name}.part${i + 1}`;
					logMessage(
						`File size more than 25MB, splitting file: ${chunkName}`,
						"error"
					);
					uploadedFiles++;
					await uploadFile(
						owner,
						repo,
						branch,
						token,
						chunkName,
						chunk,
						statusDiv,
						progressBar,
						progressPercent,
						totalFiles,
						uploadedFiles
					);
				}
			} else {
				// File size is below 99MB; upload directly
				uploadedFiles++;
				await uploadFile(
					owner,
					repo,
					branch,
					token,
					file.name,
					file,
					statusDiv,
					progressBar,
					progressPercent,
					totalFiles,
					uploadedFiles
				);
			}
		}
		logMessage("Completed", "complete");
	} catch (error) {
		logMessage(`Error: ${error.message}`, "error");
	}
});

// Function to split a file into chunks at newline boundaries
async function splitFile(file, chunkSize) {
	const text = await file.text(); // Read the file as text
	const chunks = [];
	let start = 0;
	let currentSize = 0;

	for (let i = 0; i < text.length; i++) {
		currentSize++;
		if (text[i] === "\n" || currentSize >= chunkSize) {
			// If we hit a newline or reach the chunk size
			chunks.push(text.slice(start, i + 1)); // Include the newline character
			start = i + 1;
			currentSize = 0; // Reset chunk size counter
		}
	}

	// Add the remaining text as the last chunk
	if (start < text.length) {
		chunks.push(text.slice(start));
	}

	return chunks.map((chunk) => new Blob([chunk])); // Convert each chunk back to a Blob
}

// Function to upload a file or chunk
// async function uploadFile(owner, repo, branch, token, fileName, fileContent, statusDiv, progressBar, progressPercent, totalFiles, uploadedFiles) {
//   const fileText = await fileContent.text();
//   const encodedContent = btoa(fileText);

//   // Check if the file exists and get its SHA
//   const fileSha = await getFileSha(owner, repo, fileName, branch, token);

//   // Upload or overwrite the file
//   const uploadUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;
//   const payload = JSON.stringify({
//     message: `Upload/Overwrite ${fileName}`,
//     content: encodedContent,
//     branch: branch,
//     sha: fileSha || undefined, // Include SHA to overwrite if the file exists
//   });

//   const response = await fetch(uploadUrl, {
//     method: "PUT",
//     headers: {
//       Authorization: `Bearer ${token}`,
//       Accept: "application/vnd.github+json",
//       "Content-Type": "application/json",
//     },
//     body: payload,
//   });

//   const data = await response.json();
//   if (response.ok) {
//     logMessage(`Uploaded: ${fileName}`,"success");
//   } else {
//     logMessage(`Failed to upload ${fileName}: ${data.message}`,"error");
//   }

//   // Update overall progress
//   const overallProgress = (uploadedFiles / totalFiles) * 100;
//   progressBar.value = overallProgress;
//   progressPercent.textContent = `${Math.round(overallProgress)}%`;
// }

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

// async function fetchGitHubFileContent(owner, repo, fileName, branch, token) {
//   const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}?ref=${branch}`;
//   try {
//     const response = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         Accept: "application/vnd.github+json",
//       },
//     });

//     if (response.ok) {
//       const data = await response.json();
//       return atob(data.content); // Decode Base64 content
//     } else if (response.status === 404) {
//       return null; // File does not exist
//     } else {
//       throw new Error(`Failed to fetch file content: ${response.statusText}`);
//     }
//   } catch (error) {
//     console.error("Error fetching GitHub file content:", error);
//     throw error;
//   }
// }

async function uploadFile(
	owner,
	repo,
	branch,
	token,
	fileName,
	fileContent,
	statusDiv,
	progressBar,
	progressPercent,
	totalFiles,
	uploadedFiles
) {
	const localFileText = await fileContent.text();
	const encodedContent = btoa(localFileText);

	// Check if the file exists and get its SHA
	const fileSha = await getFileSha(owner, repo, fileName, branch, token);

	// Fetch GitHub file content for comparison
	if (fileSha) {
		const githubFileContent = await fetchGitHubFileContent(
			owner,
			repo,
			fileName,
			branch,
			token
		);
		if (githubFileContent === localFileText) {
			logMessage(`Skipped: ${fileName} (No changes detected)`, "info");
			// Update progress even if skipped
			const overallProgress = (uploadedFiles / totalFiles) * 100;
			progressBar.value = overallProgress;
			progressPercent.textContent = `${Math.round(overallProgress)}%`;
			return; // Skip upload if contents are identical
		}
	}

	// Upload or overwrite the file
	const uploadUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;
	const payload = JSON.stringify({
		message: `Upload/Overwrite ${fileName}`,
		content: encodedContent,
		branch: branch,
		sha: fileSha || undefined, // Include SHA to overwrite if the file exists
	});

	const response = await fetch(uploadUrl, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"Content-Type": "application/json",
		},
		body: payload,
	});

	const data = await response.json();
	if (response.ok) {
		logMessage(`Uploaded: ${fileName}`, "success");
	} else {
		logMessage(`Failed to upload ${fileName}: ${data.message}`, "error");
	}

	// Update overall progress
	const overallProgress = (uploadedFiles / totalFiles) * 100;
	progressBar.value = overallProgress;
	progressPercent.textContent = `${Math.round(overallProgress)}%`;
}

// Fetch GitHub file content for comparison
async function fetchGitHubFileContent(owner, repo, fileName, branch, token) {
	const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}?ref=${branch}`;
	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
			},
		});

		if (response.ok) {
			const data = await response.json();
			return atob(data.content); // Decode Base64 content
		} else if (response.status === 404) {
			return null; // File does not exist
		} else {
			throw new Error(`Failed to fetch file content: ${response.statusText}`);
		}
	} catch (error) {
		console.error("Error fetching GitHub file content:", error);
		throw error;
	}
}
