const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Konfigurasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint Registrasi Pengguna
app.post('/register', async (req, res) => {
    const { name, email, password, profile_picture } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (existingUserError && existingUserError.code !== 'PGRST116') {
        return res.status(500).json({ error: 'Failed to check existing users.' });
    }

    if (existingUser) {
        return res.status(400).json({ error: 'Email already taken.' });
    }

    const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password, profile_picture }]);

    if (error) {
        return res.status(500).json({ error: 'Failed to register user.' });
    }

    res.status(201).json({ message: 'User registered successfully.' });
});

// Endpoint Login Pengguna
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    res.status(200).json({ message: 'Login successful.', user });
});

// Endpoint Mendapatkan Semua Pengguna
app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, profile_picture');

    if (error) {
        return res.status(500).json({ error: 'Failed to retrieve users.' });
    }

    res.status(200).json(data);
});

app.get('/tasks', async (req, res) => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*');

    if (error) {
        return res.status(500).json({ error: 'Failed to retrieve tasks.' });
    }

    // Cek jika dueDate ada
    data.forEach(task => {
        if (!task.due_date) {
            console.warn('Due date missing for task:', task);
        }
    });

    res.status(200).json(data);
});


app.post('/tasks', async (req, res) => {
    const { title, due_date, category, urgency, description, assigned_to } = req.body;
    console.log('Received data:', { title, due_date, category, urgency, description, assigned_to });

    // Validasi data jika perlu
    if (!title || !due_date || !category || !urgency || !description || !assigned_to) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Format due_date menjadi string ISO jika perlu
        const formattedDueDate = new Date(due_date).toISOString(); // Format menjadi string ISO

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title,
                due_date: formattedDueDate, // Menggunakan formattedDueDate
                category,
                urgency,
                description,
                assigned_to // Pastikan ini dalam format JSON jika tipe data di database adalah jsonb
            }])
            .single(); // Use .single() if you are expecting a single row response

        if (error) {
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Error inserting task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Endpoint untuk memindahkan tugas ke board
app.patch('/tasks/:id/move-to-to-do', async (req, res) => {
    const taskId = parseInt(req.params.id);

    try {
        // Update status tugas di database Supabase
        const { data, error } = await supabase
            .from('tasks')
            .update({ state: 'to-do' }) // Mengubah status tugas menjadi 'to-do'
            .eq('id', taskId);

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Task moved to board with status "to-do"' });
    } catch (error) {
        console.error('Error moving task to board:', error);
        res.status(500).json({ error: 'Error moving task to board' });
    }
})
app.patch('/tasks/:id/move-to-inProgress', async (req, res) => {
    const taskId = parseInt(req.params.id);
    console.log(`Received request to move task ${taskId} to inProgress`);

    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({ state: 'inProgress' }) // Mengubah status tugas menjadi 'inProgress'
            .eq('id', taskId);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Task successfully updated:', data);
        res.status(200).json({ message: 'Task moved to board with status "inProgress"' });
    } catch (error) {
        console.error('Error moving task to board:', error);
        res.status(500).json({ error: 'Error moving task to board' });
    }
});


app.patch('/tasks/:id/move-to-testing', async (req, res) => {
    const taskId = parseInt(req.params.id);
    console.log(`Received request to move task ${taskId} to testing`);

    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({ state: 'testing' }) // Mengubah status tugas menjadi 'testing'
            .eq('id', taskId);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Task successfully updated:', data);
        res.status(200).json({ message: 'Task moved to board with status "testing"' });
    } catch (error) {
        console.error('Error moving task to board:', error);
        res.status(500).json({ error: 'Error moving task to board' });
    }
});
app.patch('/tasks/:id/move-to-done', async (req, res) => {
    const taskId = parseInt(req.params.id);
    console.log(`Received request to move task ${taskId} to done`);

    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({ state: 'done' }) // Mengubah status tugas menjadi 'done'
            .eq('id', taskId);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Task successfully updated:', data);
        res.status(200).json({ message: 'Task moved to board with status "done"' });
    } catch (error) {
        console.error('Error moving task to board:', error);
        res.status(500).json({ error: 'Error moving task to board' });
    }
});

app.patch('/tasks/:id/move-to-backlog', async (req, res) => {
    const taskId = parseInt(req.params.id);

    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({ state: 'backlog' })
            .eq('id', taskId);

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Task moved to backlog' });
    } catch (error) {
        console.error('Error moving task to backlog:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Endpoint untuk menghapus tugas secara permanen
app.delete('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id);
    console.log('Deleting task with ID:', taskId); // Debugging

    try {
        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            throw error;
        }

        console.log('Task deleted from database');
        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task from database:', error);
        res.status(500).json({ error: 'Error deleting task' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});