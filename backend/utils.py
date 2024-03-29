import openai
import time
import json
import sys
import threading
import time

sys.stdout.reconfigure(encoding='utf-8')

COT_PROMPT = """
{"request": "Write about French Revolution", 
"language": Language of <request>,
"context:  <Introduce in one sentence about <request> in <language>>, 
"prompts": [Write separate prompts for <request> in <language>, format JSON array]}
A: 
{"language": "English",
"context": "The French Revolution was a period of radical political and societal change in France that began with the Estates General of 1789 and ended with the formation of the French Consulate in November 1799",
"prompts": [
"What caused the French Revolution?", 
"How did the French Revolution shape modern democracy?", 
"Identify three major accomplishments of the French Revolution.", 
"Who were the key figures in the French Revolution and how did they shape its outcome?",  
"What challenges has France faced since then in terms of political stability?"]}
Q:
{"request": "Hãy phân tích về Chủ nghĩa tiêu thụ", 
"language": Language of <request>,
"context:  <Introduce in one sentence about <request> in <language>>, 
"prompts": [Write separate prompts for <request> in <language>, format JSON array]}
A:
{"language": "Vietnamese",
"context": "Chủ nghĩa tiêu thụ là một lý thuyết kinh tế xã hội cho rằng việc tiêu thụ hàng hóa và dịch vụ là mục tiêu chính của hoạt động kinh tế và là động lực chính để thúc đẩy sự phát triển kinh tế.",
"prompts": [
"Chủ nghĩa tiêu thụ là gì?",
"Nguyên nhân dẫn đến chủ nghĩa tiêu thụ",
"Chủ nghĩa tiêu thụ có ảnh hưởng như thế nào đến sự phát triển kinh tế?",
"Điểm khác biệt giữa chủ nghĩa tiêu thụ và chủ nghĩa sản xuất là gì?",
"Các yếu tố nào ảnh hưởng đến quyết định tiêu thụ của người tiêu dùng?"]}
Q:
{"request": "{{PROMPT}}", 
"language": Language of <request>,
"context:  <Introduce in one sentence about <request> in <language>>, 
"prompts": [Write separate prompts for <request> in <language>, format JSON array]}
A:
"""

HASHTAG_PROMPT = """
Create hashtag for each "{}", format as JSON array. E.g.: ["#hashtag1", "#hashtag2"]
"""

WRITING_PROMPT = 'With context: {}. Complete writing task for "{}" in language {}.'

DEFAULT_ERROR_RESPONSE = 'Something wrong, please try again.', 500

class Setting():
    def __init__(
            self,
            engine = "gpt-3.5-turbo-16k",
            temperature = 0,
            frequency_penalty = 1.5,
            presence_penalty = 0,
            top_p = 1,
            max_tokens = 14000,
            api_time_interval = 20,
            avg_token_per_word = {
                "English": 4,
                "Vietnamese": 1}):
        self.engine = engine
        self.temperature = temperature
        self.api_time_interval = api_time_interval
        self.max_tokens = max_tokens
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.top_p = top_p
        self.avg_token_per_word = avg_token_per_word

class OpenApiHandler:
    def __init__(self, api_key, setting=Setting()):
        openai.api_key = api_key
        self.setting = setting
        self.processing = False
        self.processed_epoch = 0.0
        self._lock = threading.Lock()

    def __compare_and_set_processing(self, expected_value, new_value):
        success = False
        with self._lock:
            self.processed_epoch = time.time()
            if self.processing == expected_value:
                self.processing = new_value
                success = True
        return success

    def __request_openai(self, input, max_length=None, setting=None):
        messages = [{
            'role': 'user',
            'content': input
        }]
        if setting==None:
            setting = self.setting
        if max_length == None:
            max_tokens = setting.max_tokens
        else:
            max_tokens = min(setting.max_tokens, max_length)
        if self.processing and self.processed_epoch + 10000 > time.time():
            for i in range(5):
                time.sleep(setting.api_time_interval/4)
                if not self.processing:
                    if self.__compare_and_set_processing(False, True):
                        break
                    else:
                        return 'Server is busy, please retry later', 503
        else:
            self.processed_epoch = time.time()
            self.processing = True
        threading.Thread(target=self.__set_proccessing, args=(setting.api_time_interval,)).start()
        try:
            response = openai.ChatCompletion.create(
                model=setting.engine,
                messages=messages,
                max_tokens=max_tokens,
                temperature=setting.temperature,
                top_p=setting.top_p,
                frequency_penalty=setting.frequency_penalty,
                presence_penalty=setting.presence_penalty,
                stop=None
            )
            return response['choices'][0]['message']['content'], 200
        except (openai.error.OpenAIError) as e:
            print(e._message)
            return 'OpenAIError', 500
    
    def __set_proccessing(self, delay):
        time.sleep(delay)
        self.processing = False
        self.processed_epoch = 0.0

    def get_hashtags(self, raw_prompt):
        raw_prompt = raw_prompt.replace("\"", "`")
        raw_prompt = raw_prompt.replace("\'", "`")
        break_down_prompt = COT_PROMPT.replace("{{PROMPT}}", raw_prompt)
        break_down_result, status_code = self.__request_openai(break_down_prompt)
        if status_code >= 400:
            return break_down_result, status_code
        try:
            json_result = json.loads(break_down_result)
            context = json_result['context']
            prompt_list = json_result['prompts']
            language = json_result['language']
        except (json.decoder.JSONDecodeError, KeyError) as e:
            return DEFAULT_ERROR_RESPONSE
            
        if isinstance(prompt_list, list) and len(prompt_list) > 0:
            hashtag_prompt = HASHTAG_PROMPT.format(prompt_list)
            hashtag_result, status_code = self.__request_openai(hashtag_prompt)
            hashtag_list = json.loads(hashtag_result)
            if isinstance(hashtag_list, list) and len(hashtag_list) == len(prompt_list):
                result = {
                    'context': context,
                    'prompts': {},
                    'language': language
                }
                for i in range(len(prompt_list)):
                    result['prompts'][hashtag_list[i]] = prompt_list[i]
                return result, 200
            else:
                return DEFAULT_ERROR_RESPONSE
        else:
            return DEFAULT_ERROR_RESPONSE
        
    def get_writing(self, raw_prompt, context, language,setting=None):
        raw_prompt = raw_prompt.replace("\"", "`")
        raw_prompt = raw_prompt.replace("\'", "`")
        prompt = WRITING_PROMPT.format(raw_prompt, context, language)
        result, status_code = self.__request_openai(prompt, setting=setting)
        if status_code >= 400:
            return result, status_code
        else:
            return result, 200