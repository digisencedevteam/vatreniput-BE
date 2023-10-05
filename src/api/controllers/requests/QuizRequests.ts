import {
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayUnique,
  IsOptional,
  IsUrl,
  IsNumber,
} from 'class-validator';

export class CreateQuestionBody {
  @IsString()
  public text?: string;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayUnique()
  public options?: string[];

  @IsNumber()
  public correctOption: number = 0;
}

export class CreateQuizBody {
  @IsString()
  public title?: string;

  @IsString()
  public description?: string;

  @IsArray()
  @ArrayMinSize(1)
  public questions: CreateQuestionBody[] = [];

  @IsString()
  public thumbnail?: string;

  @IsString()
  public availableUntil: string = '';
}
