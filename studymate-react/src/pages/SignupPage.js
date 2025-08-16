import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaGraduationCap } from 'react-icons/fa';

// Styled components are not included here for brevity,
// but they would remain the same.

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePassword = (password) => {
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return 'none';
    if (password.length < 6) return 'weak';
    
    // Check for a mix of uppercase, lowercase, number, and special character
    const isStrong = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password);
    return isStrong ? 'strong' : 'medium';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email.';
    if (!formData.password.trim()) newErrors.password = 'Password is required.';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions.';

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      const result = await signup(formData);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      // Handle server-side errors
      setErrors(prev => ({ ...prev, general: 'Signup failed. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (id, label, type, icon, placeholder, value) => (
    <FormGroup key={id}>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <InputWrapper>
        <FormInput
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={errors[id] ? 'error' : (value && !errors[id] ? 'success' : '')}
        />
        <InputIcon>{icon}</InputIcon>
      </InputWrapper>
      {errors[id] && <FormError>{errors[id]}</FormError>}
    </FormGroup>
  );

  return (
    <PageContainer>
      <SignupCard initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <LogoSection>
          <LogoIcon />
          <Title>Join Studymate</Title>
          <Subtitle>Create your account to start learning</Subtitle>
        </LogoSection>

        <Form onSubmit={handleSubmit}>
          {renderInput('name', 'Full Name', 'text', <FaUser />, 'Enter your full name', formData.name)}
          {renderInput('email', 'Email Address', 'email', <FaEnvelope />, 'Enter your email', formData.email)}
          
          <FormGroup>
            <FormLabel htmlFor="password">Password</FormLabel>
            <InputWrapper>
              <FormInput
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className={errors.password ? 'error' : ''}
              />
              <InputIcon onClick={() => setShowPassword(prev => !prev)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </InputIcon>
            </InputWrapper>
            {errors.password && <FormError>{errors.password}</FormError>}
            {formData.password && (
              <PasswordStrength>
                <StrengthBar>
                  <StrengthFill strength={getPasswordStrength(formData.password)} />
                </StrengthBar>
                <StrengthText strength={getPasswordStrength(formData.password)}>
                  Password strength: {getPasswordStrength(formData.password)}
                </StrengthText>
              </PasswordStrength>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
            <InputWrapper>
              <FormInput
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'error' : (formData.confirmPassword && formData.password === formData.confirmPassword ? 'success' : '')}
              />
              <InputIcon onClick={() => setShowPassword(prev => !prev)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </InputIcon>
            </InputWrapper>
            {errors.confirmPassword && <FormError>{errors.confirmPassword}</FormError>}
            {formData.confirmPassword && formData.password === formData.confirmPassword && <FormSuccess>Passwords match</FormSuccess>}
          </FormGroup>
          
          <TermsCheckbox>
            <Checkbox
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
            />
            <TermsText htmlFor="agreeToTerms">
              I agree to the <a href="#terms">Terms and Conditions</a> and <a href="#privacy">Privacy Policy</a>
            </TermsText>
          </TermsCheckbox>
          {errors.agreeToTerms && <FormError>{errors.agreeToTerms}</FormError>}

          <SignupButton type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </SignupButton>
        </Form>
        
        {/* The rest of the JSX remains the same */}
      </SignupCard>
    </PageContainer>
  );
};

export default SignupPage;