// In LoginModal.jsx handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    console.log('Login API response:', data);

    if (response.ok) {
      // Use the global login function
      login(data.user, data.token);
      setSuccess('Login successful!');
      
      // Force a small delay to ensure state update
      setTimeout(() => {
        console.log('Calling onLoginSuccess with:', data.user);
        onLoginSuccess(data.user);
      }, 100);
    } else {
      setError(data.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    setError('Network error. Please check your connection and try again.');
  } finally {
    setIsLoading(false);
  }
};
