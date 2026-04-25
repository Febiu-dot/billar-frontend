import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner, Modal, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface SetScore { a: string; b: string; }

export default function JudgePage() {
  const { user } = useAuth();
  const [tables, setTables]           = useState<Table[]>([]);
  const [loading, setLoading]         = useState(true);
  const [resultModal, setResultModal] = useState<Match | null>(null);
  const [sets, setSets]               = useState<SetScore[]>([{ a: '', b: '' }]);
  const [isWO, setIsWO]               = useState(false);
  const [woPlayerId, setWoPlayerId]   = useState('');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const fetchTables = () => {
    const url = user?.venueId ? `/tables?venueId=${user.venueId}` : '/tables';
    api.get(url).then(r => { setTables(r.data); setLoading(false); });
  };

  useEffect(() => {
    fetchTables();
    if (user?.venueId) socket.emit('join:venue', user.venueId);
    socket.on('match:updated', fetchTables);
    socket.on('table:updated', fetchTables);
    return () => {
      socket.off('match:updated', fetchTables);
      socket.off('table:updated', fetchTables);
    };
  }, [user?.venueId]);

  const openResultModal = (match: Match) => {
    setResultModal(match);
    setSets([{ a: '', b: '' }]);
    setIsWO(false);
    setWoPlayerId('');
    setNotes('');
    setError('');
  };

  const handleStartMatch = async (matchId: number) => {
    await api.put(`/matches/${matchId}/start`)
