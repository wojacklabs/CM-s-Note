import { useState, useEffect } from 'react';
import { Note, User } from '../types';
import { queryNotesByProject, queryProjectIcons } from '../services/irysService';
import UserCard from '../components/UserCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import './UsersPage.css';

interface UsersPageProps {
  selectedProject: string;
}

function UsersPage({ selectedProject }: UsersPageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Filter states
  const [selectedCM, setSelectedCM] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<string>('all');

  useEffect(() => {
    if (selectedProject) {
      loadNotes();
    }
  }, [selectedProject]);

  useEffect(() => {
    applyFilters();
  }, [users, selectedCM, selectedUserType, selectedIcon]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const projectNotes = await queryNotesByProject(selectedProject);
      setNotes(projectNotes);
      
      // Group notes by user
      const userMap = new Map<string, User>();
      
      projectNotes.forEach(note => {
        const key = note.twitterHandle;
        if (!userMap.has(key)) {
          userMap.set(key, {
            twitterHandle: note.twitterHandle,
            displayName: note.nickname || note.user || note.twitterHandle,
            notes: []
          });
        }
        userMap.get(key)!.notes.push(note);
      });
      
      const userList = Array.from(userMap.values());
      setUsers(userList);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Filter by CM
    if (selectedCM !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.cmName === selectedCM)
      );
    }

    // Filter by User Type
    if (selectedUserType !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.userType === selectedUserType)
      );
    }

    // Filter by Icon
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
      <div className="users-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users and notes...</p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="users-page">
        <div className="empty-state">
          <p>Please select a project to view users and notes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Users & Notes - {selectedProject}</h2>
        <p className="page-subtitle">
          Total: {filteredUsers.length} users, {notes.length} notes
        </p>
      </div>

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
            <p>No users found with the selected filters.</p>
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

      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
}

export default UsersPage; 