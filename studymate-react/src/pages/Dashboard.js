import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaShareAlt, 
  FaCalendarCheck, 
  FaClock,
  FaCalendar,
  FaBook,
  FaUpload,
  FaPlus,
  FaDownload,
  FaComment,
  FaFile,
  FaChevronUp,
  FaPaperPlane
} from 'react-icons/fa';

const DashboardContainer = styled.div`
  padding-top: 70px;
  min-height: 100vh;
  background: #f8fafc;
`;

const DashboardHeader = styled.div`
  background: white;
  padding: 2rem 0;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const WelcomeSubtitle = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DashboardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Sidebar = styled.aside`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  height: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 1024px) {
    order: -1;
  }
`;

const SidebarSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SidebarTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuickActions = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const QuickActionItem = styled.li`
  margin-bottom: 0.5rem;
`;

const QuickActionLink = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  color: #374151;
  text-align: left;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: #f3f4f6;
    color: #667eea;
  }
`;

const ActivityFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
`;

const ActivityIcon = styled.div`
  width: 24px;
  height: 24px;
  background: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.span`
  color: #374151;
  font-weight: 500;
`;

const ActivityTime = styled.small`
  color: #6b7280;
  display: block;
  margin-top: 0.25rem;
`;

const StatsSection = styled.section`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled(motion.div)`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1.5rem;
  border-radius: 1rem;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  opacity: 0.9;
`;

const StatChange = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.5rem;
`;

const DashboardSection = styled.section`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ViewAllLink = styled.button`
  background: none;
  border: none;
  color: #667eea;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EventItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
  }
`;

const EventTime = styled.div`
  text-align: center;
  min-width: 80px;
`;

const EventDay = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
`;

const EventMonth = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
`;

const EventDetails = styled.div`
  flex: 1;
`;

const EventTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const EventDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const EventMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
`;

const EventMetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const EventActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const JoinButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #5a67d8;
    transform: translateY(-1px);
  }
`;

const ChatWidget = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 350px;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  
  @media (max-width: 768px) {
    width: calc(100vw - 2rem);
    right: 1rem;
    left: 1rem;
  }
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 1rem 1rem 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const ChatTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChatToggle = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
`;

const ChatBody = styled.div`
  display: ${props => props.isOpen ? 'block' : 'none'};
  max-height: 400px;
  overflow-y: auto;
`;

const ChatMessages = styled.div`
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
`;

const Message = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  &.sent {
    flex-direction: row-reverse;
    
    .message-content {
      background: #667eea;
      color: white;
    }
  }
`;

const MessageAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 1rem;
  max-width: 80%;
  word-wrap: break-word;
`;

const MessageSender = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #374151;
`;

const MessageText = styled.p`
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
`;

const MessageTime = styled.div`
  font-size: 0.625rem;
  color: #6b7280;
  margin-top: 0.25rem;
  text-align: right;
`;

const ChatInput = styled.div`
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
`;

const ChatInputField = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ChatSendButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #5a67d8;
  }
`;

const Dashboard = () => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const upcomingEvents = [
    {
      id: 1,
      day: '15',
      month: 'Dec',
      title: 'Advanced Physics Workshop',
      description: 'Deep dive into quantum mechanics and relativity',
      time: '2:00 PM',
      location: 'Science Lab 3',
      attendees: 24
    },
    {
      id: 2,
      day: '18',
      month: 'Dec',
      title: 'Chemistry Study Group',
      description: 'Organic chemistry review session',
      time: '4:00 PM',
      location: 'Library Room 2',
      attendees: 18
    }
  ];

  const handleJoinEvent = (eventId) => {
    console.log('Joining event:', eventId);
  };

  const handleChatSend = () => {
    if (chatMessage.trim()) {
      console.log('Sending message:', chatMessage);
      setChatMessage('');
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <HeaderContent>
          <WelcomeTitle>Welcome back, {user?.name || 'Student'}!</WelcomeTitle>
          <WelcomeSubtitle>Here's what's happening with your studies today</WelcomeSubtitle>
        </HeaderContent>
      </DashboardHeader>

      <MainContent>
        <DashboardGrid>
          <StatsSection>
            <SectionTitle>
              <FaUsers />
              Your Learning Statistics
            </SectionTitle>
            <StatsGrid>
              <StatCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <StatIcon>
                  <FaUsers />
                </StatIcon>
                <StatNumber>12</StatNumber>
                <StatLabel>Study Groups</StatLabel>
                <StatChange>+2 this week</StatChange>
              </StatCard>
              
              <StatCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <StatIcon>
                  <FaShareAlt />
                </StatIcon>
                <StatNumber>47</StatNumber>
                <StatLabel>Resources Shared</StatLabel>
                <StatChange>+5 this week</StatChange>
              </StatCard>
              
              <StatCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <StatIcon>
                  <FaCalendarCheck />
                </StatIcon>
                <StatNumber>8</StatNumber>
                <StatLabel>Events Attended</StatLabel>
                <StatChange>+1 this month</StatChange>
              </StatCard>
              
              <StatCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <StatIcon>
                  <FaClock />
                </StatIcon>
                <StatNumber>156</StatNumber>
                <StatLabel>Study Hours</StatLabel>
                <StatChange>+12 this week</StatChange>
              </StatCard>
            </StatsGrid>
          </StatsSection>

          <DashboardSection>
            <SectionHeader>
              <SectionTitle>
                <FaCalendar />
                Upcoming Events
              </SectionTitle>
              <ViewAllLink>View All</ViewAllLink>
            </SectionHeader>
            <EventsList>
              {upcomingEvents.map((event) => (
                <EventItem key={event.id}>
                  <EventTime>
                    <EventDay>{event.day}</EventDay>
                    <EventMonth>{event.month}</EventMonth>
                  </EventTime>
                  <EventDetails>
                    <EventTitle>{event.title}</EventTitle>
                    <EventDescription>{event.description}</EventDescription>
                    <EventMeta>
                      <EventMetaItem>
                        <FaClock />
                        {event.time}
                      </EventMetaItem>
                      <EventMetaItem>
                        <FaUsers />
                        {event.attendees} attending
                      </EventMetaItem>
                    </EventMeta>
                  </EventDetails>
                  <EventActions>
                    <JoinButton onClick={() => handleJoinEvent(event.id)}>
                      Join
                    </JoinButton>
                  </EventActions>
                </EventItem>
              ))}
            </EventsList>
          </DashboardSection>
        </DashboardGrid>

        <Sidebar>
          <SidebarSection>
            <SidebarTitle>
              <FaPlus />
              Quick Actions
            </SidebarTitle>
            <QuickActions>
              <QuickActionItem>
                <QuickActionLink>
                  <FaUpload />
                  Upload Resource
                </QuickActionLink>
              </QuickActionItem>
              <QuickActionItem>
                <QuickActionLink>
                  <FaCalendar />
                  Create Event
                </QuickActionLink>
              </QuickActionItem>
              <QuickActionItem>
                <QuickActionLink>
                  <FaUsers />
                  Create Group
                </QuickActionLink>
              </QuickActionItem>
            </QuickActions>
          </SidebarSection>

          <SidebarSection>
            <SidebarTitle>
              <FaComment />
              Recent Activity
            </SidebarTitle>
            <ActivityFeed>
              <ActivityItem>
                <ActivityIcon>
                  <FaPlus />
                </ActivityIcon>
                <ActivityContent>
                  <ActivityText>Joined "Physics Study Group"</ActivityText>
                  <ActivityTime>2 hours ago</ActivityTime>
                </ActivityContent>
              </ActivityItem>
              <ActivityItem>
                <ActivityIcon>
                  <FaShareAlt />
                </ActivityIcon>
                <ActivityContent>
                  <ActivityText>Shared "Chemistry Notes.pdf"</ActivityText>
                  <ActivityTime>4 hours ago</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            </ActivityFeed>
          </SidebarSection>
        </Sidebar>
      </MainContent>

      <ChatWidget>
        <ChatHeader onClick={toggleChat}>
          <ChatTitle>
            <FaComment />
            Study Buddy Chat
          </ChatTitle>
          <ChatToggle>
            {isChatOpen ? <FaChevronUp /> : <FaEye />}
          </ChatToggle>
        </ChatHeader>
        <ChatBody isOpen={isChatOpen}>
          <ChatMessages>
            <Message>
              <MessageAvatar src="https://via.placeholder.com/32" alt="Study Buddy" />
              <MessageContent>
                <MessageSender>Study Buddy</MessageSender>
                <MessageText>Hello! How can I help you with your studies today?</MessageText>
                <MessageTime>10:30 AM</MessageTime>
              </MessageContent>
            </Message>
            <Message className="sent">
              <MessageContent>
                <MessageText>Hi! I'm looking for help with calculus integration.</MessageText>
                <MessageTime>10:32 AM</MessageTime>
              </MessageContent>
            </Message>
          </ChatMessages>
          <ChatInput>
            <ChatInputField
              placeholder="Type your message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
            />
            <ChatSendButton onClick={handleChatSend}>
              <FaPaperPlane />
            </ChatSendButton>
          </ChatInput>
        </ChatBody>
      </ChatWidget>
    </DashboardContainer>
  );
};

export default Dashboard;
