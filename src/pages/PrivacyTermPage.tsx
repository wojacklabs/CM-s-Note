import { Link } from 'react-router-dom';
import './PrivacyTermPage.css';

function PrivacyTermPage() {
  return (
    <div className="privacy-term-page">
      <div className="privacy-header">
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>Privacy Policy for CM's Notes Extension</h1>
        <p className="last-updated">Last updated: July 15, 2025</p>
      </div>

      <div className="privacy-content">
        <section className="privacy-section">
          <h2>1. Extension Overview</h2>
          <p>
            CM's Notes Extension is a Chrome browser extension that allows authorized Community Managers (CMs) to create, store, and manage notes about Twitter/X user profiles. The extension integrates with the Irys distributed storage network to provide secure, decentralized data storage.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Data Collection and Usage</h2>
          
          <h3>2.1 Personal Information We Collect</h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Data Type</th>
                  <th>Purpose</th>
                  <th>Required/Optional</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Authentication Credentials</strong>
                    <ul>
                      <li>Project name</li>
                      <li>CM (Community Manager) name</li>
                      <li>Password</li>
                    </ul>
                  </td>
                  <td>User authentication and permission verification</td>
                  <td>Required</td>
                </tr>
                <tr>
                  <td>
                    <strong>Note Content</strong>
                    <ul>
                      <li>User nicknames</li>
                      <li>User type classifications</li>
                      <li>Text descriptions</li>
                      <li>Image attachments (if provided)</li>
                    </ul>
                  </td>
                  <td>Creating and storing notes about Twitter users</td>
                  <td>Required for core functionality</td>
                </tr>
                <tr>
                  <td>
                    <strong>Twitter Profile Data</strong>
                    <ul>
                      <li>Twitter usernames</li>
                      <li>Public profile information</li>
                      <li>Tweet content (contextual)</li>
                    </ul>
                  </td>
                  <td>Associating notes with specific Twitter users</td>
                  <td>Required for core functionality</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="privacy-section">
          <h2>3. Chrome Extension Permissions</h2>
          <p>Our extension requests the following permissions:</p>
          
          <div className="permissions-table">
            <table>
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Purpose</th>
                  <th>Data Access</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>storage</td>
                  <td>Store authentication tokens and user preferences locally</td>
                  <td>Local browser storage only</td>
                </tr>
                <tr>
                  <td>tabs</td>
                  <td>Detect when user navigates to Twitter/X pages</td>
                  <td>URL information for Twitter/X domains only</td>
                </tr>
                <tr>
                  <td>activeTab</td>
                  <td>Interact with content on the current Twitter/X page</td>
                  <td>Active tab content on Twitter/X only</td>
                </tr>
                <tr>
                  <td>alarms</td>
                  <td>Periodic synchronization of notes data</td>
                  <td>No personal data collected</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="host-permissions">
            <h3>Host Permissions</h3>
            <ul>
              <li>twitter.com/*</li>
              <li>x.com/*</li>
              <li>gateway.irys.xyz/*</li>
              <li>uploader.irys.xyz/*</li>
            </ul>
            <p>Access Twitter/X content and communicate with Irys network - Twitter page content and Irys API communications</p>
          </div>
        </section>

        <section className="privacy-section">
          <h2>4. Data Storage and Security</h2>
          <ul className="security-list">
            <li><strong>Irys Network:</strong> All notes and associated data are stored on the Irys distributed storage network</li>
            <li><strong>Local Browser Storage:</strong> Authentication tokens and user preferences are stored locally</li>
            <li><strong>Encryption:</strong> All data transmissions use HTTPS/TLS encryption</li>
            <li><strong>Access Control:</strong> Only authorized CMs with valid credentials can access note creation features</li>
            <li><strong>Size Limitations:</strong> Data is limited to 100KB per note to prevent abuse</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>5. Data Sharing and Third Parties</h2>
          <p>We do not sell, rent, or trade your personal information to third parties under any circumstances.</p>
          
          <p>Our extension integrates with the following third-party services:</p>
          <ul className="third-party-list">
            <li><strong>Twitter/X Platform:</strong> For accessing public profile information (required for core functionality)</li>
            <li><strong>Irys Network:</strong> For decentralized data storage (required for data persistence)</li>
            <li><strong>Solana Blockchain:</strong> For wallet generation and blockchain transactions (required for Irys integration)</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>6. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul className="rights-list">
            <li><strong>Access:</strong> Request a copy of all personal data we have about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>7. Data Retention</h2>
          <p>We retain your personal information:</p>
          <ul className="retention-list">
            <li><strong>Authentication Data:</strong> Until you uninstall the extension or revoke access</li>
            <li><strong>Note Data:</strong> Until you delete specific notes or request account deletion</li>
            <li><strong>Browser Data:</strong> Until you clear browser data or uninstall the extension</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>Our extension is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13.</p>
        </section>

        <section className="privacy-section">
          <h2>9. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. When we make changes:</p>
          <ul className="changes-list">
            <li>We will post the updated policy on this page</li>
            <li>We will update the "Last updated" date</li>
            <li>For material changes, we will provide additional notice within the extension</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>10. Contact Information</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
          <div className="contact-info">
            <p><strong>Email:</strong> cws911112@gmail.com</p>
            <p><strong>Extension Name:</strong> CM's Notes Extension</p>
            <p><strong>Response Time:</strong> We aim to respond to all inquiries within 30 days</p>
          </div>
        </section>

        <section className="privacy-section">
          <h2>11. Compliance</h2>
          <p>This Privacy Policy is designed to comply with:</p>
          <ul className="compliance-list">
            <li>Chrome Web Store Developer Program Policies</li>
            <li>General Data Protection Regulation (GDPR)</li>
            <li>California Consumer Privacy Act (CCPA)</li>
            <li>Other applicable privacy laws and regulations</li>
          </ul>
        </section>

        <section className="privacy-section final-section">
          <p className="final-note">
            By installing and using CM's Notes Extension, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with this policy, please do not install or use the extension.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyTermPage; 