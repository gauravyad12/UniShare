-- Add DELETE policy to group_chat_typing_status table
CREATE POLICY "Users can delete their own typing status" 
ON group_chat_typing_status 
FOR DELETE 
USING (auth.uid() = user_id);
