import { useContext } from 'react';
import { AuthContext } from './useAuth';

export function useAuth() {
    return useContext(AuthContext);
}