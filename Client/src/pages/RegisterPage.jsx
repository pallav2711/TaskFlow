import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: { role: 'developer' } });

  const password = watch('password');
  const selectedRole = watch('role');

  const onSubmit = async ({ name, email, password, role }) => {
    setServerError('');
    try {
      await registerUser(name, email, password, role);
      toast.success('Account created! Welcome to TaskFlow.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900">TaskFlow</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>

          {serverError && (
            <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              id="name" label="Full name" type="text"
              placeholder="Jane Smith" required autoComplete="name"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
              })}
            />

            <Input
              id="email" label="Email address" type="email"
              placeholder="you@example.com" required autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email' },
              })}
            />

            <Input
              id="password" label="Password" type="password"
              placeholder="At least 6 characters" required autoComplete="new-password"
              error={errors.password?.message} helperText="Must be at least 6 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />

            <Input
              id="confirmPassword" label="Confirm password" type="password"
              placeholder="Re-enter your password" required autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === password || 'Passwords do not match',
              })}
            />

            {/* ── Role selector ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                I am joining as <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Manager card */}
                <label
                  className={`relative flex flex-col gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'manager'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio" value="manager" className="sr-only"
                    {...register('role')}
                  />
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedRole === 'manager' ? 'bg-indigo-600' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-4 h-4 ${selectedRole === 'manager' ? 'text-white' : 'text-gray-500'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <span className={`text-sm font-semibold ${selectedRole === 'manager' ? 'text-indigo-700' : 'text-gray-700'}`}>
                    Manager
                  </span>
                  <span className="text-xs text-gray-500 leading-snug">
                    Create projects, invite developers, assign tasks
                  </span>
                  {selectedRole === 'manager' && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>

                {/* Developer card */}
                <label
                  className={`relative flex flex-col gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'developer'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio" value="developer" className="sr-only"
                    {...register('role')}
                  />
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedRole === 'developer' ? 'bg-indigo-600' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-4 h-4 ${selectedRole === 'developer' ? 'text-white' : 'text-gray-500'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <span className={`text-sm font-semibold ${selectedRole === 'developer' ? 'text-indigo-700' : 'text-gray-700'}`}>
                    Developer
                  </span>
                  <span className="text-xs text-gray-500 leading-snug">
                    Work on assigned tasks, update progress
                  </span>
                  {selectedRole === 'developer' && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
              Create account
            </Button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            By creating an account you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
