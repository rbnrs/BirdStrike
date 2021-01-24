
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
import json
import os
import time
from django.template import Context
from django.core import serializers
from datetime import datetime
from django.template import loader
from django.middleware.gzip import GZipMiddleware


def birdstrike(request):
    template = loader.get_template('birdstrike.html')
    context = {
        
    }
    response = HttpResponse(template.render(context, request))
    return GZipMiddleware().process_response(request, response)
