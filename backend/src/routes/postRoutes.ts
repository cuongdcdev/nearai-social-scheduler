import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Post } from '../entities/Post';


const postRoutes = Router();

// Get all posts by userId
// postRoutes.get('/:uid', async (req, res) => {
//     try {
//         const uid = req.params.uid;
//         const postRepository = getRepository(Post);
//         const posts = await postRepository.find({ 
//             where: { 
//                 userId: Number(uid) },
//             relations: ['channel']
//         });
//         res.json(posts);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching posts', error });
//     }
// });


export default postRoutes;