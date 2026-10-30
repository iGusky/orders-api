import { useEffect } from "react"
import { getMovements } from "../../services/api"
export function Movimientos() {

    const fetchMovements = async () => {
        try {
            console.log('hola')
            const response = await getMovements({ page: 1, perPage: 50 })
            console.log(response)
        } catch(e) {

        }
    }

    useEffect(() => {
        fetchMovements()
    }, [])

    return (
        <div>
            <h1>Desde movimientos</h1>
        </div>
    )
}