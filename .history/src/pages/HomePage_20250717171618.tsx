import { useState, useEffect } from 'react';
import { Note, User, Tweet } from '../types';
import { queryNotesByProject, queryProjectIcons } from '../services/irysService';
import { getMultipleUsersTweets } from '../services/twitterService';
import UserCard from '../components/UserCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import TweetCard from '../components/TweetCard';
import Marquee from 'react-fast-marquee';
import './HomePage.css';

interface HomePageProps {
  selectedProject: string;
}

function HomePage({ selectedProject }: HomePageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Filter states
  const [selectedCM, setSelectedCM] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<string>('all');
  
  // Marquee controls
  const [speed, setSpeed] = useState(50);

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
      
      // Load tweets
      const uniqueHandles = Array.from(
        new Set(projectNotes.map(note => note.twitterHandle))
      );
      const allTweets = await getMultipleUsersTweets(uniqueHandles);
      setTweets(allTweets);
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

      {tweets.length > 0 && (
        <section className="tweets-section">
          <h2 className="section-title">Recent Tweets</h2>
          <div className="marquee-controls">
            <label>
              Speed: 
              <input
                type="range"
                min="20"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
              <span>{speed}</span>
            </label>
          </div>
          
          <div className="marquee-container">
            <Marquee
              speed={speed}
              gradient={true}
              gradientColor="#faf8f3"
              gradientWidth={120}
            >
              {tweets.map((tweet, index) => (
                <TweetCard key={`${tweet.id}-${index}`} tweet={tweet} />
              ))}
            </Marquee>
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