'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { showToast } from '@/lib/toast';
import { DiceRoller } from './DiceRoller';
import Image from 'next/image';

interface ChatProps {
  campaignId: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

function isDiceFormula(message: string) {
  // Only allow dice formulas like: 2d8 + 2d6 + 5 (optionally with whitespace)
  return /^\s*([+\-]?\d*d(4|6|8|10|12|20|100)\s*)+([+\-]\s*\d+)?\s*$/i.test(message.trim());
}

function parseDiceFormula(formula: string) {
  console.log('Parsing formula:', formula);
  // Supports e.g. 2d8 + 2d6 + 5 or d20 + 3
  const diceRegex = /(\d*)d(100|4|6|8|10|12|20)/gi;
  const diceCounts: Record<number, number> = {};
  let match;
  while ((match = diceRegex.exec(formula))) {
    const count = match[1] ? parseInt(match[1]) : 1;
    const die = parseInt(match[2]);
    console.log(`Found dice: ${count}d${die}`);
    diceCounts[die] = (diceCounts[die] || 0) + count;
  }
  // Remove all dice expressions, then sum remaining numbers as modifiers
  const formulaNoDice = formula.replace(diceRegex, '');
  const modRegex = /([+-]?\d+)/g;
  let modifier = 0;
  const modMatches = formulaNoDice.match(modRegex);
  if (modMatches) {
    modifier = modMatches.map(Number).reduce((a, b) => a + b, 0);
  }
  console.log('Parsed result:', { diceCounts, modifier });
  return { diceCounts, modifier };
}

function rollDice(diceCounts: Record<number, number>, modifier: number) {
  console.log('Dice counts received:', diceCounts);
  const rolls: { die: number; values: number[] }[] = [];
  let total = 0;
  
  // Handle d100 separately to ensure it's not treated as d10
  if (diceCounts[100]) {
    console.log('Rolling d100, count:', diceCounts[100]);
    const count = diceCounts[100];
    const values = Array.from({ length: count }, () => {
      const roll = Math.floor(Math.random() * 100) + 1;
      console.log('d100 roll:', roll);
      return roll;
    });
    rolls.push({ die: 100, values });
    total += values.reduce((a, b) => a + b, 0);
  }

  // Handle all other dice types
  for (const die of [4, 6, 8, 10, 12, 20]) {
    const count = diceCounts[die] || 0;
    if (count > 0) {
      console.log(`Rolling d${die}, count:`, count);
      const values = Array.from({ length: count }, () => {
        const roll = Math.floor(Math.random() * die) + 1;
        console.log(`d${die} roll:`, roll);
        return roll;
      });
      rolls.push({ die, values });
      total += values.reduce((a, b) => a + b, 0);
    }
  }
  
  total += modifier;
  console.log('Final rolls:', rolls);
  console.log('Total:', total);
  return { rolls, total };
}

export function Chat({ campaignId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [resetCounter, setResetCounter] = useState(0);
  const [isGM, setIsGM] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Don't show toast for every failed poll
      if (!isLoading) {
        showToast.error('Error loading messages');
      }
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, isLoading]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [campaignId, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/role`);
        if (response.ok) {
          const data = await response.json();
          setIsGM(data.role === 'GM');
        }
      } catch {
        setIsGM(false);
      }
    };
    fetchRole();
  }, [campaignId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Only roll if the entire message is a dice formula
    if (isDiceFormula(newMessage)) {
      const { diceCounts, modifier } = parseDiceFormula(newMessage);
      const result = rollDice(diceCounts, modifier);
      let breakdown = result.rolls.map(r => `d${r.die}: [${r.values.join(', ')}]`).join(' | ');
      if (modifier !== 0) breakdown += ` | Modifier: ${modifier > 0 ? '+' : ''}${modifier}`;
      const msg = `🎲 ${newMessage.trim()}\nResult: ${result.total}${breakdown ? `\n${breakdown}` : ''}`;
      try {
        const response = await fetch(`/api/chat/${campaignId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: msg }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        setNewMessage('');
        setResetCounter((c) => c + 1);
        fetchMessages();
      } catch (error: unknown) {
        console.error('Error sending message:', error);
        showToast.error('Error sending message');
      }
      return;
    }

    // Normal message
    try {
      const response = await fetch(`/api/chat/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      setNewMessage('');
      fetchMessages();
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      showToast.error('Error sending message');
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history?')) return;
    try {
      const response = await fetch(`/api/chat/${campaignId}/clear`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear chat');
      fetchMessages();
    } catch {
      showToast.error('Failed to clear chat');
    }
  };

  if (isLoading) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
            {message.user.image && (
              <Image
                src={message.user.image || '/default-avatar.png'}
                alt={message.user.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
                unoptimized
              />
            )}
            <div>
              <p className="font-semibold text-blue-700 dark:text-blue-300">{message.user.name}</p>
              <p>{message.content}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex space-x-2 mt-auto">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Send
        </button>
      </form>
      <DiceRoller onFormulaChange={setNewMessage} reset={resetCounter} />
      {isGM && (
        <button
          onClick={clearChat}
          className="mt-4 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
        >
          Clear Chat
        </button>
      )}
    </div>
  );
}
