import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';
import S from './register/registerStyles';
import { COUNTRIES } from './register/registerConfig';
import RegisterFormContent from './register/RegisterFormContent';
import RegisterStyles from './register/RegisterStyles';



export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  // ── step: 1 = account info, 2 = location + password ──
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name:'', email:'', password:'', confirm:'',
    phone:'', country:'Pakistan', city:'',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Step 1 → Step 2 validation ──
  const goNext = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim())  { setError('Please enter your full name.');     return; }
    if (!form.email.trim()) { setError('Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    setStep(2);
  };

  // ── Final submit (step 2) ──
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.');                 return; }

    // Guard: make sure register exists and is a function
    if (typeof register !== 'function') {
      setError('Auth error: register is not available. Check AuthContext.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        phone:    form.phone.trim(),
        country:  form.country,
        city:     form.city.trim(),
      });
      navigate('/');
    } catch (err) {
      console.error('Registration error full:', err);
      console.error('Response data:', err?.response?.data);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                 ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isPak = form.country === 'Pakistan';

  return (
    <div className="responsive-page register-page" style={S.page}>
      <RegisterStyles />

      <div style={S.blob1} />
      <div style={S.blob2} />

      <RegisterFormContent {...{ BrandMark, COUNTRIES, Link, S, error, form, goNext, isPak, loading, set, setError, setStep, step, submit }} />
    </div>
  );
}

/* ── Styles ── */
