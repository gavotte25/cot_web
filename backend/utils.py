import openai
import time
import json
import tiktoken
import sys
import copy
sys.stdout.reconfigure(encoding='utf-8')

META_PROMPT = """
Giving "{}", answer below question in json format:
"writing_request": Answer 1 for yes, 0 for no: Is this a writing request?
"word_count": How many words it requires, 0 if not request?
"language": What language is it?
"""

COT_PROMPT = """
Write separate prompts for: "{}" shortly, without word count.
"""

HASHTAG_PROMPT = """
Create hashtag for each "{}", format as JSON array.
"""

class Setting():
    def __init__(
            self,
            engine = "text-davinci-003",
            temperature = 0,
            api_time_interval = 1.0,
            max_tokens = 256,
            frequency_penalty = 0,
            presence_penalty = 0,
            avg_token_per_word = {
                "English": 4,
                "Vietnamese": 1}):
        self.engine = engine
        self.temperature = temperature
        self.api_time_interval = api_time_interval
        self.max_tokens = max_tokens
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.avg_token_per_word = avg_token_per_word

class OpenApiHandler:
    def __init__(self, setting=Setting()):
        self.update_setting(setting)
        self.encoding = tiktoken.encoding_for_model(self.setting.engine)

    def update_setting(self, setting):
        self.setting = setting
        # strict_setting to constraint meta info extract more consistent
        self.strict_setting = copy.deepcopy(setting)
        self.strict_setting.frequency_penalty = 1.5
        self.strict_setting.presence_penalty = 0
        self.strict_setting.temperature = 0
    
    def __request_openai(self, input, max_length=None, setting=None):
        if setting==None:
            setting = self.setting
        if max_length == None:
            max_tokens = setting.max_tokens
        else:
            max_tokens = min(setting.max_tokens, max_length)
        # GPT-3 API allows each users execute the API within 60 times in a minute ...
        # time.sleep(1)
        time.sleep(setting.api_time_interval)
        
        # https://beta.openai.com/account/api-keys
        openai.api_key = "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"
        
        response = openai.Completion.create(
            engine=setting.engine,
            prompt=input,
            max_tokens=max_tokens,
            temperature=setting.temperature,
            top_p=1,
            frequency_penalty=setting.frequency_penalty,
            presence_penalty=setting.presence_penalty,
            stop=None
        )
        return response["choices"][0]["text"]
    
    def __get_meta_info(self, raw_prompt):
        prompt = META_PROMPT.format(raw_prompt)
        result = self.__request_openai(prompt, setting=self.strict_setting)
        print(result)
        meta = json.loads(result)
        return meta

    def __breakdown_request(self, raw_prompt):
        prompt = COT_PROMPT.format(raw_prompt)
        result = self.__request_openai(prompt, setting=self.strict_setting)
        return result
    
    def __trim_requests(self, str_prompts):
        prompt = HASHTAG_PROMPT.format(str_prompts)
        result = self.__request_openai(prompt, setting=self.strict_setting)
        return json.loads(result)

    def __request(self, hashtag, meta, word_limit=0):
        prompt = "Write about " + hashtag
        if word_limit == 0:
            max_length = None
        else:
            max_length = self.count_token(prompt) + self.estimate_token(meta['language'], word_limit)
            prompt += " in {} words".format(word_limit)
        prompt += " language: " + meta['language']
        print(prompt)
        print(max_length)
        return self.__request_openai(prompt, max_length)
    
    def cot_request(self, raw_prompt):
        meta = self.__get_meta_info(raw_prompt)
        if meta['writing_request'] == 0:
            return self.__request_openai(raw_prompt)
        str_prompts = self.__breakdown_request(raw_prompt)
        hashtags = self.__trim_requests(str_prompts)
        word_count = meta['word_count']
        prompt_number = len(hashtags)
        if prompt_number > 0:
            avg_word_count = max(round(word_count / len(hashtags)), 50)
        else:
            avg_word_count = word_count
        answer = ''
        for hashtag in hashtags:
            answer += self.__request(hashtag, meta, avg_word_count)
            if word_count > 0 and len(answer.split()) > word_count:
                break
        return answer

    def count_token(self, str_input):
        num_token = len(self.encoding.encode(str_input))
        return num_token
    
    def estimate_token(self, language, word_count):
        avg_tpw = 4
        if language in self.setting.avg_token_per_word:
            avg_tpw = self.setting.avg_token_per_word.get(language)
        return word_count * avg_tpw