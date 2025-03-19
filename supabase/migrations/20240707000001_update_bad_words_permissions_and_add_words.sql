-- Remove public write access from bad_words table
ALTER TABLE bad_words ENABLE ROW LEVEL SECURITY;

-- Create policy for read-only access
DROP POLICY IF EXISTS "Allow public read access" ON bad_words;
CREATE POLICY "Allow public read access"
ON bad_words FOR SELECT
USING (true);

-- Add common bad words to the table
INSERT INTO bad_words (word) VALUES
-- Profanity
('fuck'), ('shit'), ('ass'), ('bitch'), ('cunt'), ('damn'), ('dick'), ('cock'), ('pussy'), ('asshole'),
-- Racial slurs
('nigger'), ('nigga'), ('chink'), ('spic'), ('wetback'), ('kike'), ('gook'), ('towelhead'), ('beaner'), ('cracker'),
('wop'), ('dago'), ('mick'), ('polack'), ('jap'), ('zipperhead'), ('raghead'), ('honky'), ('gringo'),
-- Sexual terms
('blowjob'), ('handjob'), ('rimjob'), ('cumshot'), ('facial'), ('anal'), ('dildo'), ('vibrator'), ('fleshlight'),
-- Hate speech
('faggot'), ('fag'), ('dyke'), ('tranny'), ('retard'), ('retarded'), ('nazi'), ('hitler'), ('holocaust'),
-- Drug references
('cocaine'), ('heroin'), ('meth'), ('crack'), ('weed'), ('pot'), ('marijuana'), ('dope'), ('junkie'),
-- Offensive terms
('whore'), ('slut'), ('hooker'), ('prostitute'), ('pedo'), ('pedophile'), ('rape'), ('rapist'), ('molest'),
-- Internet slang
('fml'), ('wtf'), ('stfu'), ('gtfo'), ('lmfao'), ('lmao'), ('rofl'), ('yolo'), ('swag'),
-- Misc offensive
('terrorist'), ('jihad'), ('suicide'), ('kill'), ('murder'), ('bomb'), ('explosive'), ('porn'), ('pornography')
ON CONFLICT (word) DO NOTHING;
