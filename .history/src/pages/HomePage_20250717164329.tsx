import { useState, useEffect } from 'react';
import { Note, User } from '../types';
import { queryNotesByProject, queryProjectIcons } from '../services/irysService';
import { getEmbeddedTweetsForUsers, initializeTwitterWidgets } from '../services/twitterService';
import UserCard from '../components/UserCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import EmbeddedTweet from '../components/EmbeddedTweet';
import { LatestTweet } from '../components/LatestTweet';
import './HomePage.css';

interface HomePageProps {
  selectedProject: string;
}

function HomePage({ selectedProject }: HomePageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [embeddedTweets, setEmbeddedTweets] = useState<{ username: string; embedHTML: string | null; tweetUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Filter states
  const [selectedCM, setSelectedCM] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<string>('all');

  // Initialize Twitter widgets on component mount
  useEffect(() => {
    initializeTwitterWidgets();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadData();
    }
  }, [selectedProject]);

  useEffect(() => {
    applyFilters();
  }, [users, selectedCM, selectedUserType, selectedIcon]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load notes
      const projectNotes = await queryNotesByProject(selectedProject);
      setNotes(projectNotes);
      
      // Group notes by user
      const userMap = new Map<string, User>();
      
      projectNotes.forEach(note => {
        const key = note.twitterHandle;
        if (!userMap.has(key)) {
          userMap.set(key, {
            twitterHandle: note.twitterHandle,
            displayName: note.twitterHandle, // Use handle as display name
            notes: []
          });
        }
        userMap.get(key)!.notes.push(note);
      });
      
      const userList = Array.from(userMap.values());
      setUsers(userList);
      
      // Load embedded tweets
      const uniqueHandles = Array.from(
        new Set(projectNotes.map(note => note.twitterHandle))
      );
      const tweets = await getEmbeddedTweetsForUsers(uniqueHandles.slice(0, 10)); // Limit to 10 users for performance
      setEmbeddedTweets(tweets);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (selectedCM !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.cmName === selectedCM)
      );
    }

    if (selectedUserType !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.userType === selectedUserType)
      );
    }

    if (selectedIcon !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.iconUrl === selectedIcon)
      );
    }

    setFilteredUsers(filtered);
  };

  const getUniqueValues = (key: keyof Note): string[] => {
    const values = new Set<string>();
    notes.forEach(note => {
      const value = note[key];
      if (value && typeof value === 'string') {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="home-page">
        <div className="empty-state">
          <p>Please select a project from above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Debug section for testing RSS fetching */}
      <section className="debug-section">
        <h2 className="section-title">RSS Debug Test</h2>
        <div className="debug-tweets">
          <LatestTweet username="Wojacklabs" />
          <LatestTweet username="elonmusk" />
          <LatestTweet username="vitalikbuterin" />
        </div>
      </section>

      <section className="users-section">
        <FilterBar
          cms={getUniqueValues('cmName')}
          userTypes={getUniqueValues('userType')}
          icons={notes.map(n => ({ url: n.iconUrl, name: n.iconUrl })).filter((v, i, a) => a.findIndex(t => t.url === v.url) === i)}
          selectedCM={selectedCM}
          selectedUserType={selectedUserType}
          selectedIcon={selectedIcon}
          onCMChange={setSelectedCM}
          onUserTypeChange={setSelectedUserType}
          onIconChange={setSelectedIcon}
        />

        <div className="users-grid">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <UserCard
                key={user.twitterHandle}
                user={user}
                onNoteClick={setSelectedNote}
              />
            ))
          )}
        </div>
      </section>

      {embeddedTweets.length > 0 && (
        <section className="tweets-section">
          <h2 className="section-title">Recent Tweets</h2>
          <div className="embedded-tweets-grid">
            {embeddedTweets.map((tweet, index) => (
              tweet.embedHTML && (
                <EmbeddedTweet
                  key={`${tweet.username}-${index}`}
                  embedHTML={tweet.embedHTML}
                  username={tweet.username}
                />
              )
            ))}
          </div>
          <div className="tweets-info">
            <p>
              <strong>Note:</strong> To display real tweets, provide actual tweet URLs or connect to Twitter API.
            </p>
          </div>
        </section>
      )}

      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
}

export default HomePage; 