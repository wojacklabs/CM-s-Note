import { useState, useEffect } from 'react';
import { Note, User } from '../types';
import { queryNotesByProject } from '../services/irysService';
import UserCard from '../components/UserCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import UserProfileCard from '../components/UserProfileCard';
import Marquee from 'react-fast-marquee';
import './HomePage.css';

interface HomePageProps {
  selectedProject: string;
}

function HomePage({ selectedProject }: HomePageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
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
            displayName: note.twitterHandle,
            notes: []
          });
        }
        userMap.get(key)!.notes.push(note);
      });
      
      const userList = Array.from(userMap.values());
      setUsers(userList);
      
      // Get recent users (sorted by most recent note timestamp)
      const recentUserList = userList
        .map(user => ({
          ...user,
          latestNoteTimestamp: Math.max(...user.notes.map(note => note.timestamp || 0))
        }))
        .sort((a, b) => b.latestNoteTimestamp - a.latestNoteTimestamp)
        .slice(0, 20); // Show top 20 recent users
      
      setRecentUsers(recentUserList);
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

      {recentUsers.length > 0 && (
        <section className="recent-users-section">
          <h2 className="section-title">Recently Noted Users</h2>
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
              {recentUsers.map((user, index) => (
                <UserProfileCard key={`${user.twitterHandle}-${index}`} user={user} />
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