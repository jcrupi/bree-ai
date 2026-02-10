import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { VINE_CONVERSATIONS } from '../data/vineConversations';
import { TeamMember } from '../types';
interface VinesVisualProps {
  onSelectMember?: (memberId: string) => void;
  selectedMemberId?: string | null;
  onSelectConversation?: (conversationId: string) => void;
  selectedConversationId?: string | null;
}
export function VinesVisual({
  onSelectMember,
  selectedMemberId,
  onSelectConversation,
  selectedConversationId
}: VinesVisualProps) {
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  // Vine path definitions
  const vines = [
  {
    d: 'M50,400 C80,350 40,300 60,250 C80,200 120,180 100,120 C90,90 110,50 130,20',
    color: '#8B4513',
    width: 2,
    delay: 0
  },
  {
    d: 'M60,400 C40,360 90,310 80,260 C70,210 50,190 70,130 C80,100 60,60 80,30',
    color: '#A0522D',
    width: 1.5,
    delay: 0.2
  },
  {
    d: 'M40,400 C70,370 30,320 50,270 C70,220 100,200 90,140 C85,110 105,70 120,40',
    color: '#8B0000',
    width: 1.8,
    delay: 0.4
  },
  {
    d: 'M55,400 C65,355 55,305 75,255 C95,205 85,155 105,105 C115,80 125,55 115,25',
    color: '#CD5C5C',
    width: 1.2,
    delay: 0.6
  },
  // Branching off
  {
    d: 'M60,250 C90,230 110,240 130,220',
    color: '#8B4513',
    width: 1,
    delay: 1.2
  },
  {
    d: 'M80,260 C50,240 30,250 10,230',
    color: '#A0522D',
    width: 1,
    delay: 1.4
  }];

  // Map team members to specific positions
  const memberPositions: Record<
    string,
    {
      x: number;
      y: number;
      rotate: number;
    }> =
  {
    h1: {
      x: 130,
      y: 20,
      rotate: 45
    },
    h2: {
      x: 80,
      y: 30,
      rotate: -30
    },
    h3: {
      x: 120,
      y: 40,
      rotate: 60
    },
    ha1: {
      x: 100,
      y: 120,
      rotate: 15
    },
    ha2: {
      x: 70,
      y: 130,
      rotate: -20
    },
    ha3: {
      x: 90,
      y: 140,
      rotate: 10
    },
    ai1: {
      x: 130,
      y: 220,
      rotate: 15
    },
    ai2: {
      x: 10,
      y: 230,
      rotate: -45
    },
    ai3: {
      x: 60,
      y: 250,
      rotate: 30
    }
  };
  // Calculate connection lines for conversations
  const connectionLines = useMemo(() => {
    return VINE_CONVERSATIONS.map((vine) => {
      const points = vine.participants.
      map((pId) => memberPositions[pId]).
      filter(Boolean);
      if (points.length < 2) return null;
      // Create a path connecting all participants
      // Simple approach: Move to first, line to subsequent
      const d = points.reduce((acc, point, i) => {
        if (i === 0) return `M${point.x},${point.y}`;
        // Use quadratic curve for smoother connections
        return `${acc} L${point.x},${point.y}`;
      }, '');
      return {
        id: vine.id,
        d,
        participants: vine.participants
      };
    }).filter(Boolean) as {
      id: string;
      d: string;
      participants: string[];
    }[];
  }, []);
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'human-design':
        return '#D97706';
      case 'human-ai':
        return '#0891B2';
      case 'ai-special':
        return '#7C3AED';
      default:
        return '#71717a';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#10B981';
      case 'active':
        return '#8B5CF6';
      case 'busy':
        return '#F59E0B';
      case 'idle':
        return '#94A3B8';
      default:
        return '#94A3B8';
    }
  };
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 200 420"
        className="w-full h-full max-w-[400px] drop-shadow-2xl"
        style={{
          filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
        }}>

        {/* Background Vines */}
        {vines.map((vine, i) =>
        <motion.path
          key={i}
          d={vine.d}
          fill="none"
          stroke={vine.color}
          strokeWidth={vine.width}
          strokeLinecap="round"
          initial={{
            pathLength: 0,
            opacity: 0
          }}
          animate={{
            pathLength: 1,
            opacity: 0.4
          }} // Lower opacity to let connections pop
          transition={{
            duration: 3,
            delay: vine.delay,
            ease: 'easeInOut'
          }} />

        )}

        {/* Conversation Connection Lines */}
        {connectionLines.map((line) => {
          const isSelected = selectedConversationId === line.id;
          const isRelatedToSelectedMember =
          selectedMemberId && line.participants.includes(selectedMemberId);
          const isActive = isSelected || isRelatedToSelectedMember;
          return (
            <motion.path
              key={line.id}
              d={line.d}
              fill="none"
              stroke={isSelected ? '#10B981' : '#F59E0B'} // Emerald if selected, Amber if related
              strokeWidth={isActive ? 2 : 0.5}
              strokeOpacity={isActive ? 0.8 : 0.1}
              strokeDasharray={isActive ? 'none' : '4 4'}
              initial={{
                pathLength: 0,
                opacity: 0
              }}
              animate={{
                pathLength: 1,
                opacity: isActive ? 1 : 0.2,
                strokeWidth: isActive ? 2 : 0.5
              }}
              transition={{
                duration: 1.5,
                ease: 'easeInOut'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConversation?.(line.id);
              }}
              style={{
                cursor: 'pointer'
              }} />);


        })}

        {/* Team Member Nodes */}
        {TEAM_MEMBERS.map((member, i) => {
          const pos = memberPositions[member.id] || {
            x: 100,
            y: 200,
            rotate: 0
          };
          const color = getCategoryColor(member.category);
          const statusColor = getStatusColor(member.status);
          const delay = 2.0 + i * 0.15;
          const isSelected = selectedMemberId === member.id;
          const isHovered = hoveredMemberId === member.id;
          return (
            <motion.g
              key={member.id}
              initial={{
                scale: 0,
                opacity: 0
              }}
              animate={{
                scale: isSelected || isHovered ? 1.2 : 1,
                opacity:
                selectedMemberId && !isSelected && !isHovered ? 0.5 : 1
              }}
              transition={{
                duration: 0.3,
                delay: delay,
                type: 'spring'
              }}
              onMouseEnter={() => setHoveredMemberId(member.id)}
              onMouseLeave={() => setHoveredMemberId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectMember?.(member.id);
              }}
              style={{
                cursor: 'pointer'
              }}>

              {/* Leaf Background */}
              <motion.path
                d={`M${pos.x},${pos.y} Q${pos.x + 10},${pos.y - 10} ${pos.x + 20},${pos.y} Q${pos.x + 10},${pos.y + 10} ${pos.x},${pos.y}`}
                fill={color}
                opacity={0.3}
                transform={`rotate(${pos.rotate} ${pos.x} ${pos.y})`} />


              {/* Selection Ring */}
              {isSelected &&
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="16"
                fill="none"
                stroke="white"
                strokeWidth="1"
                initial={{
                  scale: 0.8,
                  opacity: 0
                }}
                animate={{
                  scale: 1.1,
                  opacity: 1
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 1
                }} />

              }

              {/* Avatar Circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="12"
                fill={color}
                stroke={color}
                strokeWidth="1.5"
                strokeOpacity="0.5" />


              {/* Initials or Icon */}
              {member.isAI ?
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold">

                  ⚡
                </text> :

              <text
                x={pos.x}
                y={pos.y + 2.5}
                textAnchor="middle"
                fill="white"
                fontSize="7"
                fontWeight="bold"
                fontFamily="sans-serif">

                  {member.avatar || member.name.substring(0, 2).toUpperCase()}
                </text>
              }

              {/* Status Dot */}
              <circle
                cx={pos.x + 8}
                cy={pos.y + 8}
                r="3"
                fill={statusColor}
                stroke="white"
                strokeWidth="1" />

            </motion.g>);

        })}

        {/* Tooltips */}
        <AnimatePresence>
          {hoveredMemberId &&
          <Tooltip memberId={hoveredMemberId} positions={memberPositions} />
          }
        </AnimatePresence>
      </svg>
    </div>);

}
function Tooltip({
  memberId,
  positions









}: {memberId: string;positions: Record<string, {x: number;y: number;}>;}) {
  const member = TEAM_MEMBERS.find((m) => m.id === memberId);
  const pos = positions[memberId];
  if (!member || !pos) return null;
  const width = 80;
  const height = 30;
  const x = pos.x - width / 2;
  const y = pos.y - 35;
  return (
    <motion.g
      initial={{
        opacity: 0,
        y: 5
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: 5
      }}>

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="4"
        fill="#1a1614"
        fillOpacity="0.9"
        stroke="#8B4513"
        strokeWidth="0.5" />

      <text
        x={pos.x}
        y={y + 12}
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="bold"
        fontFamily="sans-serif">

        {member.name}
      </text>
      <text
        x={pos.x}
        y={y + 22}
        textAnchor="middle"
        fill="#8c827d"
        fontSize="6"
        fontFamily="sans-serif">

        {member.role}
      </text>
    </motion.g>);

}