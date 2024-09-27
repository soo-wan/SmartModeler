import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { storage } from './firebase/config';
import { ref, listAll, getDownloadURL } from "firebase/storage";
import './UserImages.css';

export default function UserImages() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.auth.user);

    useEffect(() => {
        const fetchImages = async () => {
            if (!user || !user.uid) return;

            const listRef = ref(storage, `create/${user.uid}`);
            try {
                const res = await listAll(listRef);
                const folderPromises = res.prefixes.map(async (folderRef) => {
                    const folderContents = await listAll(folderRef);
                    const itemPromises = folderContents.items.map(async (itemRef) => {
                        const url = await getDownloadURL(itemRef);
                        return { 
                            url: `${url}&t=${new Date().getTime()}`, 
                            name: itemRef.name, 
                            timestamp: folderRef.name 
                        };
                    });
                    return Promise.all(itemPromises);
                });
                const allImages = await Promise.all(folderPromises);
                const flattenedImages = allImages.flat();
                console.log("All images:", flattenedImages);
                setImages(flattenedImages);
            } catch (error) {
                console.error("Error fetching images: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [user]);

    const handleDownload = async (image) => {
        try {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `${image.timestamp}_${image.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
            alert("다운로드에 실패했습니다. 다시 시도해 주세요.");
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-images-container">
            <h2>Your Generated Images</h2>
            <div className="image-grid">
                {images.map((image, index) => (
                    <div key={index} className="image-item">
                        <img 
                            src={image.url} 
                            alt={`Generated ${index + 1}`} 
                            onError={(e) => {
                                console.error("Image load error for:", image.url);
                                e.target.src = 'https://via.placeholder.com/150?text=Image+Load+Error';
                            }}
                        />
                        <p>{image.timestamp}: {image.name}</p>
                        <button onClick={() => handleDownload(image)}>다운로드</button>
                    </div>
                ))}
            </div>
        </div>
    );
}