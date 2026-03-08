import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
    // Estado para armazenar o valor
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error('Error reading localStorage:', error)
            return initialValue
        }
    })

    // Função para atualizar o valor
    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.error('Error setting localStorage:', error)
        }
    }, [key, storedValue])

    return [storedValue, setValue]
}

export function useFirebaseSync(userId, localData, setLocalData, saveUserData, subscribeToUserData) {
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSync, setLastSync] = useState(null)

    // Subscribe para mudanças no Firebase
    useEffect(() => {
        if (!userId) return

        const unsubscribe = subscribeToUserData(userId, (cloudData) => {
            // Comparar timestamps para resolver conflitos
            const cloudTime = new Date(cloudData.updatedAt || 0).getTime()
            const localTime = new Date(localData.updatedAt || 0).getTime()

            if (cloudTime > localTime) {
                setLocalData(cloudData)
                setLastSync(new Date())
            }
        })

        return () => unsubscribe()
    }, [userId, subscribeToUserData, setLocalData])

    // Sync para o Firebase quando dados locais mudam
    const syncToCloud = useCallback(async () => {
        if (!userId || isSyncing) return

        setIsSyncing(true)
        try {
            await saveUserData(userId, localData)
            setLastSync(new Date())
        } catch (error) {
            console.error('Sync error:', error)
        } finally {
            setIsSyncing(false)
        }
    }, [userId, localData, saveUserData, isSyncing])

    return { isSyncing, lastSync, syncToCloud }
}
