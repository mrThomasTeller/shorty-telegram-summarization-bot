from gpt4free import forefront
import sys

# create an account
token = forefront.Account.create(logging=False)
# get a response
for response in forefront.StreamingCompletion.create(
    token=token,
    prompt=sys.argv[1],
    model='gpt-4'
):
    print(response.choices[0].text, end='')
