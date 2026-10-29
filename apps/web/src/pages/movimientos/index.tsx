import { useEffect } from "react"
import axios from "../../services/axios"
export function Movimientos() {

    const fetchMovements = async () => {
        try {
            console.log('hola')
            const response = await axios.get("/movements?page=1&perPage=50")
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