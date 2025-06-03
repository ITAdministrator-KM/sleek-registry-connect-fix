
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Lock, UserCheck } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (username: string, password: string, role: string) => void;
  isLoading: boolean;
  errors: {[key: string]: string};
}

const LoginForm = ({ onSubmit, isLoading, errors }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password, role);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="login-role" className="text-gray-700 font-medium">
          Select Role <span className="text-red-500">*</span>
        </Label>
        <Select value={role} onValueChange={setRole} name="role">
          <SelectTrigger id="login-role" className="bg-white/50 border-gray-200 focus:border-blue-500 h-12">
            <div className="flex items-center space-x-2">
              <UserCheck size={20} className="text-gray-500" />
              <SelectValue placeholder="Choose your role" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="staff">Staff Member</SelectItem>
            <SelectItem value="public">Public User</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <div className="text-sm text-red-600">{errors.role}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-username" className="text-gray-700 font-medium">
          Username <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            id="login-username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 h-12"
            placeholder="Enter your username"
            autoComplete="username"
            required
            aria-required="true"
            aria-describedby={errors.username ? "username-error" : undefined}
          />
        </div>
        {errors.username && (
          <div id="username-error" className="text-sm text-red-600" role="alert">{errors.username}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-gray-700 font-medium">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            id="login-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 h-12"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </div>
        {errors.password && (
          <div id="password-error" className="text-sm text-red-600" role="alert">{errors.password}</div>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        disabled={isLoading}
        aria-describedby="submit-button-description"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
      <div id="submit-button-description" className="sr-only">
        Submit the login form to authenticate with the selected role
      </div>
    </form>
  );
};

export default LoginForm;
