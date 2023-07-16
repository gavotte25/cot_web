import openai
import time

def decoder_for_gpt3(args, input, max_length):
    
    # GPT-3 API allows each users execute the API within 60 times in a minute ...
    # time.sleep(1)
    time.sleep(args.api_time_interval)
    
    # https://beta.openai.com/account/api-keys
    openai.api_key = "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"
    
    # Specify engine ...
    # Instruct GPT3
    if args.model == "gpt3":
        engine = "text-ada-001"
    elif args.model == "gpt3-medium":
        engine = "text-babbage-001"
    elif args.model == "gpt3-large":
        engine = "text-curie-001"
    elif args.model == "gpt3-xl":
        engine = "text-davinci-002"
    elif args.model == "text-davinci-001":
        engine = "text-davinci-001"
    elif args.model == "code-davinci-002":
        engine = "code-davinci-002"
    else:
        raise ValueError("model is not properly defined ...")
    response = openai.Completion.create(
        engine=engine,
        prompt=input,
        max_tokens=max_length,
        temperature=args.temperature,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None)

    return response["choices"][0]["text"]