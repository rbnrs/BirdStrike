
from django.http import HttpResponse
from django.shortcuts import render
import json
import os
from django.template import Context

def home(request):
    with open('static/5.json') as json_file:
        list_birds = json.load(json_file)
        context = {
            'birds' : list_birds
        }
        return render(request, "home.html", context)

def default(request): 
    return HttpResponse("Default")    

def notFound(request): 
    return HttpResponse("Not Found")    