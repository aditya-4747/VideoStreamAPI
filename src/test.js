import http from "k6/http";
import {check, sleep} from "k6";

export let options = {
    vus: 50,
    duration: '30s'
}

const BASE_URL = 'http://localhost:3000/api/v1';

export function setup() {
    const loginResponse = http.post(`${BASE_URL}/users/login`, {
        "email": "aditya@aditya.com",
        "password": "Aditya470"
    })

    check(loginResponse, {
        'login status : 200': r => r.status === 200,
        'received JWT cookie': (r) => r.cookies.accessToken && r.cookies.accessToken.length > 0
    })

    const token = loginResponse.cookies.accessToken[0].value;

    return {token};
}

// Dummy channelId & videoId for testing
const channelID = '693bd65b70566cb48869aae4';
const videoID = '693bd67a70566cb48869aaf8';

export default function(data) {
    const headers = {
        Authorization: `Bearer ${data.token}`,
        'Content-Type': 'application/json'
    }


    // Auth Routes
    http.get(`${BASE_URL}/users/get-current-user`, { headers });

    http.post(`${BASE_URL}/users/refresh-token`, {}, { headers });



    // User Routes
    http.patch(`${BASE_URL}/users/update-details`, JSON.stringify({
        "fullName": "Rahul Maddeshiya",
        "email": "rahul@aditya.com"
    }), { headers })

    http.get(`${BASE_URL}/users/get-channel/${channelID}`, { headers });



    // Video Routes
    http.post(`${BASE_URL}/video/publish-video`, JSON.stringify({
        "title": "Test Video",
        "description": "A random video for testing purpose",
        "dummy": true
    }), { headers });
    
    http.get(`${BASE_URL}/video/get-video/${videoID}`, { headers });
    
    http.patch(`${BASE_URL}/video/update-details/${videoID}`, JSON.stringify({
        "title": "Updated Title",
        "description": "Updated description",
    }), { headers });
    
    http.get(`${BASE_URL}/video/video-query?userId=${channelID}&sortBy=duration&sortType=-1&limit=10&page=1`, { headers });



    // Like Route
    http.post(`${BASE_URL}/like/like-video/${videoID}`, {}, { headers });


    // Comment Route
    http.post(`${BASE_URL}/comment/add-comment/${videoID}`, JSON.stringify({
        "content": "India is not for beginners!"
    }), { headers });


    // Subscription Route
    http.patch(`${BASE_URL}/subscription/toggle-subscription/${channelID}`, {}, { headers });

    
    // Dashboard Route
    http.get(`${BASE_URL}/dashboard/get-channel-stats/${channelID}`, { headers });

    sleep(1);
}