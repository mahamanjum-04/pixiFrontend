import { useState, useEffect } from 'react';

export default function useDarkMode() {
    const [dark, setDark] = useState(() => {
        return localStorage.getItem('pixi-dark-mode') === 'true';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('pixi-dark-mode', dark);
    }, [dark]);

    return [dark, setDark];
}