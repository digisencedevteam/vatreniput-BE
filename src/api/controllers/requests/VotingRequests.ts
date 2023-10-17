import {
  IsString,
  IsArray,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

// For individual voting options
export class CreateVotingOptionBody {
  @IsString()
  public text: string = '';
}

// For the entire voting
export class CreateVotingBody {
  @IsString()
  public title: string = '';

  @IsOptional()
  @IsString()
  public description?: string;

  @IsArray()
  @ArrayMinSize(1)
  public votingOptions: CreateVotingOptionBody[] = [];
}
