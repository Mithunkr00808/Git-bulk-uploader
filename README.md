# GitHub File Uploader

This project provides a web-based tool that allows users to upload multiple files to a specified GitHub repository. It supports the following features:
- Uploading multiple files to a repository
- Overwriting existing files if their content is different
- Utilizing GitHub's API for secure file uploads with Personal Access Tokens (PAT)

## Features
- **Multi-file Upload**: Select multiple files and upload them to your GitHub repository.
- **Progress Bar**: Track the upload progress of all files with a percentage indicator.
- **Overwrite Files**: If the content of a file has changed, it will be overwritten on the GitHub repository.
- **Authentication**: Uses GitHub Personal Access Token (PAT) for secure uploads.

## Requirements

- A **GitHub account** and a **repository** where files will be uploaded.
- A **Personal Access Token (PAT)** from GitHub, which can be generated from your GitHub settings.
- A modern web browser (Chrome, Firefox, Edge, etc.).

## How to Use

1. Clone or download this repository to your local machine.

2. Open the `index.html` file in your web browser. You will see the file upload form.

3. Complete the form with the following information:
   - **GitHub Username**: Enter your GitHub username.
   - **Repository Name**: Enter the name of the repository where you want to upload files.
   - **Branch Name**: The branch you want to upload files to (defaults to `main`).
   - **Personal Access Token**: Enter your GitHub Personal Access Token. If you don’t have one, follow the instructions below to generate it.
   - **Files**: Select multiple files to upload.

4. After filling in the form, click the "Upload Files" button.

5. The progress bar will update as files are uploaded, and you will see messages indicating whether each file was successfully uploaded, skipped (if unchanged), or failed.

## GitHub Personal Access Token (PAT)

To generate a Personal Access Token (PAT) for authentication, follow these steps:

1. Go to [GitHub Settings](https://github.com/settings/tokens).
2. Click on **Generate new token**.
3. Provide a note (e.g., "File Uploader Token") and select the appropriate scopes (permissions):
   - **repo**: Full control of private repositories
   - **workflow**: Update GitHub Actions workflows (optional)
4. Click **Generate token** and copy the token. Use this token in the web form for authentication.

> **Important**: Keep your token secure and do not share it publicly.

## How It Works

1. The tool collects the necessary details from the user (GitHub username, repository, token, etc.).
2. It checks the contents of the files selected and compares them to any existing files in the target GitHub repository.
3. If the file content has changed, it is uploaded or overwritten in the repository.
4. The progress of the upload process is displayed in real-time through a progress bar that shows overall upload percentage.

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **GitHub API**: Used for file uploads, content comparison, and file management.
- **SHA-1 Hashing**: Used for comparing the contents of files before uploading them.

## Troubleshooting

- **Error: "Failed to fetch file SHA"**: This error can occur if the file doesn’t exist in the repository. Ensure that the file path and repository name are correct.
- **Token issues**: Make sure your Personal Access Token has the necessary permissions and is entered correctly in the form.

## Contributing

Contributions are welcome! If you find any bugs or want to add new features, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
