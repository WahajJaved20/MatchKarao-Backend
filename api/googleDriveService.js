const fs = require('fs');
const { google } = require('googleapis');

/**
 * Browse the link below to see the complete object returned for folder/file creation and search
 *
 * @link https://developers.google.com/drive/api/v3/reference/files#resource
 */

/**
 * @typedef {Object} PartialDriveFile
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} SearchResultResponse
 * @property {string} kind
 * @property {string} nextPageToken
 * @property {boolean} incompleteSearch
 * @property {PartialDriveFile[]} files
 */

class GoogleDriveService {
  /**
   * @param {string} clientId
   * @param {string} clientSecret
   * @param {string} redirectUri
   * @param {string} refreshToken
   */
  constructor(clientId, clientSecret, redirectUri, refreshToken) {
    this.driveClient = this.createDriveClient(clientId, clientSecret, redirectUri, refreshToken);
  }
  
  /**
   * @param {string} clientId
   * @param {string} clientSecret
   * @param {string} redirectUri
   * @param {string} refreshToken
   */
  createDriveClient(clientId, clientSecret, redirectUri, refreshToken) {
    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    client.setCredentials({ refresh_token: refreshToken });
    return google.drive({
      version: 'v3',
      auth: client,
    });
  }

  /**
   * @param {string} folderName
   * @returns {Promise<PartialDriveFile>}
   */
  createFolder(folderName) {
    return this.driveClient.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name',
    }).then(response => response.data);
  }

  /**
   * @param {string} folderName
   * @returns {Promise<PartialDriveFile|null>}
   */
  searchFolder(folderName) {
    return new Promise((resolve, reject) => {
      this.driveClient.files.list(
        {
          q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
          fields: 'files(id, name)',
        },
        (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve(res.data.files ? res.data.files[0] : null);
        },
      );
    });
  }
  
  /**
   * @param {string} fileName
   * @param {string} filePath
   * @param {string} fileMimeType
   * @param {string} [folderId]
   */
  saveFile(fileName, filePath, fileMimeType, folderId) {
    return this.driveClient.files.create({
      requestBody: {
        name: fileName,
        mimeType: fileMimeType,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: fileMimeType,
        body: fs.createReadStream(filePath),
      },
    }).then(response => response.data);
  }
}

module.exports = GoogleDriveService
