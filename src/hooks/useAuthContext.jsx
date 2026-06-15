import { useContext } from 'react';
import { AuthContext } from './useAuth.jsx';

export function useAuth() {
    return useContext(AuthContext);
}