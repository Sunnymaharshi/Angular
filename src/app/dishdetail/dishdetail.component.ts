import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Comment } from '../shared/comment';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { visibility, flyInOut, expand  } from '../animations/app.animation';
@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  // tslint:disable-next-line:use-host-property-decorator
  host: {
  '[@flyInOut]': 'true',
  'style': 'display: block;'
  },
  animations: [
    flyInOut(),
    visibility(),
    expand()
  ]

})
export class DishdetailComponent implements OnInit {
  
  @ViewChild('cform') commentFormDirective;

  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  dishcopy: Dish;

  commentForm: FormGroup;
  comment: Comment;

  visibility = 'shown';

  formErrors ={
    'author':'',
    'comment': ''
  };

  validationMessages = {
    'author':{
      'required': 'Author name is required.',
      'minlenth': 'Author name must be at least  2 characters long.'
    },
    'comment':{
      'required': 'Comment is required',
      'minlength': 'Comment must be at least 3 characters long.'
    },
  };
  
  constructor(private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) { }

  ngOnInit() {
    this.createForm(); 

    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params
    .pipe(switchMap((params: Params) => { this.visibility ='hidden';return this.dishservice.getDish(params['id']);}))
    .subscribe(dish => { this.dish = dish; this.dishcopy=dish; this.setPrevNext(dish.id); this.visibility= 'shown'; }, errmess => this.errMess = <any>errmess);
  }
  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }
  createForm(): void{
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2)] ],
      comment: ['', [Validators.required, Validators.minLength(3)] ],
      rating: 5
    });

    this.commentForm.valueChanges.subscribe(data => this.onValueChanged(data));
    this.onValueChanged();
  }

  onValueChanged(data?:any){
    if(!this.commentForm)return;
    const form =this.commentForm;

    for (const field in this.formErrors)
    {
      if(this.formErrors.hasOwnProperty(field))
      {
        //clear previous error message (if any)
        this.formErrors[field]='';
        const control=form.get(field);
        if(control && control.dirty && !control.valid)
        {
          const messages=this.validationMessages[field];
          for(const key in control.errors)
          {
            if(control.errors.hasOwnProperty(key))
            {
              this.formErrors[field] += messages[key]+' ';
            }
          }
        }
      }
    }
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.comment.date = new Date().toISOString();
    console.log(this.comment);
    this.dishcopy.comments.push(this.comment);
    this.dishservice.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });    
    this.commentFormDirective.resetForm();
    this.commentForm.reset({
      author: '',
      comment: '',
      rating: 5
    });
    
  }


}
