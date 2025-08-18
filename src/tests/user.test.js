const axios = require("axios");

describe('SignIn', () => {

    test('should signin', async () => {
        const newUser = await axios.post('http://localhost:3000/api/v1/users/login', {
            email: 'rahul@aditya.com',
            password: 'Rahul470'
        })

        expect(newUser.data.data.user.fullName).toBeDefined()
    })
})