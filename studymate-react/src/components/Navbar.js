import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGraduationCap, 
  FaBars, 
  FaTimes, 
  FaUser, 
  FaCog, 
  FaSignOutAlt,
  FaHome,
  FaCalendarAlt,
  FaBook,
  FaUsers
} from 'react-icons/fa';

const Nav = styled.nav`
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
`;

const NavLogo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  
  &:hover {
    color: #fbbf24;
  }
`;

const LogoIcon = styled(FaGraduationCap)`
  font-size: 2rem;
  color: #fbbf24;
`;

const NavMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fbbf24;
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.2);
    color: #fbbf24;
  }
  
  &.active::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: #fbbf24;
    border-radius: 2px;
  }
`;

const NavAuth = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthButton = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const LoginBtn = styled(AuthButton)`
  background: transparent;
  border: 2px solid white;
  
  &:hover {
    background: white;
    color: #2563eb;
  }
`;

const SignupBtn = styled(AuthButton)`
  background: #fbbf24;
  color: #1f2937;
  
  &:hover {
    background: #f59e0b;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
`;

const UserDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
  z-index: 1000;
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: #374151;
  text-decoration: none;
  transition: background 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #fef2f2;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: #1e40af;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 999;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 1rem;
  border-radius: 0.5rem;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Nav>
      <NavContainer>
        <NavLogo to="/">
          <LogoIcon />
          Studymate
        </NavLogo>

        <NavMenu>
          <NavLink to="/" className={isActive('/') ? 'active' : ''}>
            <FaHome style={{ marginRight: '0.5rem' }} />
            Home
          </NavLink>
          <NavLink to="/events" className={isActive('/events') ? 'active' : ''}>
            <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
            Events
          </NavLink>
          <NavLink to="/resources" className={isActive('/resources') ? 'active' : ''}>
            <FaBook style={{ marginRight: '0.5rem' }} />
            Resources
          </NavLink>
          <NavLink to="/groups" className={isActive('/groups') ? 'active' : ''}>
            <FaUsers style={{ marginRight: '0.5rem' }} />
            Groups
          </NavLink>
        </NavMenu>

        <NavAuth>
          {user ? (
            <UserMenu onClick={toggleUserMenu}>
              <UserAvatar src={user.avatar} alt={user.name} />
              <span>{user.name}</span>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <UserDropdown
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DropdownItem to="/profile">
                      <FaUser />
                      Profile
                    </DropdownItem>
                    <DropdownItem to="/settings">
                      <FaCog />
                      Settings
                    </DropdownItem>
                    <LogoutButton onClick={handleLogout}>
                      <FaSignOutAlt />
                      Logout
                    </LogoutButton>
                  </UserDropdown>
                )}
              </AnimatePresence>
            </UserMenu>
          ) : (
            <>
              <LoginBtn to="/login">Login</LoginBtn>
              <SignupBtn to="/signup">Sign Up</SignupBtn>
            </>
          )}
        </NavAuth>

        <MobileMenuButton onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuButton>
      </NavContainer>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MobileNavLink to="/" onClick={closeMobileMenu}>
              <FaHome style={{ marginRight: '0.5rem' }} />
              Home
            </MobileNavLink>
            <MobileNavLink to="/events" onClick={closeMobileMenu}>
              <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
              Events
            </MobileNavLink>
            <MobileNavLink to="/resources" onClick={closeMobileMenu}>
              <FaBook style={{ marginRight: '0.5rem' }} />
              Resources
            </MobileNavLink>
            <MobileNavLink to="/groups" onClick={closeMobileMenu}>
              <FaUsers style={{ marginRight: '0.5rem' }} />
              Groups
            </MobileNavLink>
          </MobileMenu>
        )}
      </AnimatePresence>
    </Nav>
  );
};

export default Navbar;
