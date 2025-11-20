import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export const youtubeCategories = [
    { id: 1, name: "Film & Animation" },
    { id: 2, name: "Autos & Vehicles" },
    { id: 10, name: "Music" },
    { id: 15, name: "Pets & Animals" },
    { id: 17, name: "Sports" },
    { id: 18, name: "Short Movies" },
    { id: 19, name: "Travel & Events" },
    { id: 20, name: "Gaming" },
    { id: 21, name: "Videoblogging" },
    { id: 22, name: "People & Blogs" },
    { id: 23, name: "Comedy" },
    { id: 24, name: "Entertainment" },
    { id: 25, name: "News & Politics" },
    { id: 26, name: "Howto & Style" },
    { id: 27, name: "Education" },
    { id: 28, name: "Science & Technology" },
    { id: 29, name: "Nonprofits & Activism" },
    { id: 30, name: "Movies" },
    { id: 31, name: "Anime/Animation" },
    { id: 32, name: "Action/Adventure" },
    { id: 33, name: "Classics" },
    { id: 34, name: "Comedy" },
    { id: 35, name: "Documentary" },
    { id: 36, name: "Drama" },
    { id: 37, name: "Family" },
    { id: 38, name: "Foreign" },
    { id: 39, name: "Horror" },
    { id: 40, name: "Sci-Fi/Fantasy" },
    { id: 41, name: "Thriller" },
    { id: 42, name: "Shorts" },
    { id: 43, name: "Shows" },
    { id: 44, name: "Trailers" }
  ];

const Youtube = ({ postData, setPostData }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className="mb-4 mt-4">

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                    {t('social.youtube.title')}
                    </label>
                    <Textarea 
                    value={postData.platforms.youtube.title}
                    onChange={(e) => setPostData(prev => ({
                      ...prev,
                      platforms: {
                        ...prev.platforms,
                        youtube: {
                          ...prev.platforms.youtube,
                          title: e.target.value
                        }
                      }
                    }))}
                    placeholder="Enter YouTube video title..."
                    className="mb-2 bg-white h-16 resize-none border rounded-lg p-3 w-full text-sm"
                    /> 
                  </div>
              
            <label className="text-sm font-medium text-gray-700 block mb-2">
            Tags
            </label>
            
             <Textarea 
             value={postData.platforms.youtube.tags}
             onChange={(e) => setPostData(prev => ({
               ...prev,
               platforms: {
                 ...prev.platforms,
                 youtube: {
                   ...prev.platforms.youtube,
                   tags: e.target.value
                 }
               }
             }))}
             placeholder="gaming, tutorial, how-to..."
             className="mb-2 bg-white h-16 resize-none border rounded-lg p-3 w-full text-sm"
             /> 
             </div>
    
        
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                {t('social.youtube.category')}
              </label>
              <Select 
                value={postData.platforms.youtube.category?.toString() || "22"}
                onValueChange={(value) => {
                  setPostData(prev => ({
                    ...prev,
                    platforms: {
                      ...prev.platforms,
                      youtube: {
                        ...prev.platforms.youtube,
                        category: parseInt(value)
                      }
                    }
                  }));
                }}
              >
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent>
                  {youtubeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
        </>
    )
}

export default Youtube;