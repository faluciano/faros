import { Lighthouse } from "../types";
import { useState, useEffect } from "react";
const LighthouseCard = ({ lighthouse }: { lighthouse: Lighthouse }) => {
    const [isVisited, setIsVisited] = useState(false);

    const handleVisit = async () => {
        // set visited to true and save to db
        setIsVisited(true);
        const url = "https://faros-backend.azurewebsites.net/user";
        const token = localStorage.getItem("token");
        const response = await fetch(`${url}/user/lighthouses`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lighthouseId: lighthouse.id })
        });
        const data = await response.json();
        if (data.error) {
            setIsVisited(false);
        }
        else {
            setIsVisited(true);
        }
    }

    const handleUnvisit = async () => {
        setIsVisited(false);
        const url = "https://faros-backend.azurewebsites.net/user";
        const token = localStorage.getItem("token");
        const response = await fetch(`${url}/user/lighthouses`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lighthouseId: lighthouse.id })
        });
        const data = await response.json();
        if (data.error) {
            setIsVisited(true);
        }
        else {
            setIsVisited(false);
        }
    }

    useEffect(() => {
        const fetchVisitedLighthouses = async () => {
            const url = "https://faros-backend.azurewebsites.net/user";
            const token = localStorage.getItem("token");
            const response = await fetch(`${url}/user/lighthouses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            setIsVisited(data.includes(lighthouse.id) || false);
        }
        fetchVisitedLighthouses();
    }, [lighthouse]);


    return (
        <div className="lighthouse-card" style={{ backgroundImage: `url(${lighthouse.image})`, backgroundColor: isVisited ? "lightgreen" : "white" }}>
            <h1>{lighthouse.name}</h1>
            <p>{lighthouse.state}</p>
            <p>{lighthouse.country}</p>
            <button onClick={() => handleVisit()}>Visit</button>
            <button onClick={() => handleUnvisit()}>Unvisit</button>
        </div>
    )
}

export default LighthouseCard;